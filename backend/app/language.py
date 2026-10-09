"""SMIVAI — Bhashini / AI4Bharat language service.

This is the arrangement a real deployment uses: the ULCA credentials live
here, on the server, and never reach a browser or a tablet. The client
calls /language/translate, /language/tts and /language/asr and receives
plain results.

Configure with environment variables:

    SMIVAI_BHASHINI_USER_ID     ULCA userID
    SMIVAI_BHASHINI_API_KEY     ULCA API key
    SMIVAI_BHASHINI_PIPELINE    pipeline id (a MeitY default is used otherwise)
    SMIVAI_AI4BHARAT_BASE       optional self-hosted IndicTrans2 / IndicTTS /
                                IndicConformer endpoint, used when Bhashini
                                is unreachable

Bhashini covers India's 22 scheduled languages. Khasi, Mizo, Garo and
Nagamese are not scheduled languages and have no model — requests for them
return a clear 422 rather than a silent English substitution.
"""
from __future__ import annotations

import base64
import os
from functools import lru_cache
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from .deps import Actor, current_actor
from .ratelimit import limiter

router = APIRouter(prefix="/language", tags=["language"])

# Translation, speech and recognition spend the deployment's Bhashini quota,
# so they need a signed-in caller and are capped per account.
_PER_ACCOUNT = limiter(60, 60)

MAX_TEXT = 2000
MAX_AUDIO_B64 = 2_800_000      # ≈ 2 MB of audio, about a minute of 16 kHz mono WAV


def signed_in(actor: Actor = Depends(current_actor)) -> Actor:
    _PER_ACCOUNT.hit(f"{actor.role}:{actor.actor_id}")
    return actor

AUTH_URL = os.getenv(
    "SMIVAI_BHASHINI_AUTH_URL",
    "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
)
USER_ID = os.getenv("SMIVAI_BHASHINI_USER_ID", "")
API_KEY = os.getenv("SMIVAI_BHASHINI_API_KEY", "")
PIPELINE_ID = os.getenv("SMIVAI_BHASHINI_PIPELINE", "64392f96daac500b55c543cd")
AI4BHARAT_BASE = os.getenv("SMIVAI_AI4BHARAT_BASE", "").rstrip("/")

TIMEOUT = httpx.Timeout(30.0, connect=10.0)

# Scheduled languages Bhashini serves, plus the NER languages it does not.
SCHEDULED = {
    "as", "bn", "brx", "doi", "gu", "hi", "kn", "ks", "kok", "mai", "ml",
    "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur", "en",
}
COMMUNITY_ONLY = {"kha": "Khasi", "lus": "Mizo", "grt": "Garo", "nag": "Nagamese"}


class TranslateIn(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_TEXT)
    source: str = Field(default="en", max_length=8)
    target: str = Field(max_length=8)


class TtsIn(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_TEXT)
    language: str = Field(max_length=8)
    gender: str = Field(default="female", pattern="^(female|male)$")


class AsrIn(BaseModel):
    audio_base64: str = Field(min_length=1, max_length=MAX_AUDIO_B64)
    language: str = Field(max_length=8)


def _guard(language: str) -> None:
    if language in COMMUNITY_ONLY:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"{COMMUNITY_ONLY[language]} is not one of India's scheduled languages. "
            "Neither Bhashini nor AI4Bharat publishes a model for it, so SMIVAI "
            "serves it with bundled text and recorded prompts only.",
        )
    if language not in SCHEDULED:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Unsupported language '{language}'.")


def _configured() -> bool:
    return bool(USER_ID and API_KEY)


@lru_cache(maxsize=64)
def _pipeline_cache_key(tasks: tuple[str, ...], source: str, target: str) -> str:
    return f"{tasks}|{source}|{target}"


_PIPELINES: dict[str, dict[str, Any]] = {}


async def _resolve_pipeline(tasks: list[str], source: str, target: str | None) -> dict[str, Any]:
    """Ask ULCA which service ids and inference endpoint to use."""
    key = _pipeline_cache_key(tuple(tasks), source, target or "")
    if key in _PIPELINES:
        return _PIPELINES[key]

    pipeline_tasks = []
    for task in tasks:
        lang_cfg: dict[str, str] = {"sourceLanguage": source}
        if task == "translation":
            lang_cfg["targetLanguage"] = target or "en"
        pipeline_tasks.append({"taskType": task, "config": {"language": lang_cfg}})

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            AUTH_URL,
            headers={"userID": USER_ID, "ulcaApiKey": API_KEY, "Content-Type": "application/json"},
            json={
                "pipelineTasks": pipeline_tasks,
                "pipelineRequestConfig": {"pipelineId": PIPELINE_ID},
            },
        )
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Bhashini pipeline config failed ({resp.status_code}).")

    data = resp.json()
    endpoint = data.get("pipelineInferenceAPIEndPoint") or {}
    auth = endpoint.get("inferenceApiKey") or {}
    resolved = {
        "callback_url": endpoint.get("callbackUrl"),
        "auth_name": auth.get("name"),
        "auth_value": auth.get("value"),
        "services": {
            cfg["taskType"]: (cfg.get("config") or [{}])[0].get("serviceId")
            for cfg in data.get("pipelineResponseConfig", [])
        },
    }
    if not resolved["callback_url"]:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Bhashini returned no inference endpoint.")
    _PIPELINES[key] = resolved
    return resolved


async def _compute(pipe: dict[str, Any], tasks: list[dict], input_data: dict) -> dict:
    headers = {"Content-Type": "application/json"}
    if pipe.get("auth_name"):
        headers[pipe["auth_name"]] = pipe["auth_value"]
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            pipe["callback_url"], headers=headers,
            json={"pipelineTasks": tasks, "inputData": input_data},
        )
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Bhashini compute failed ({resp.status_code}).")
    return resp.json()


async def _ai4bharat(path: str, payload: dict) -> dict | None:
    """Fallback to a self-hosted AI4Bharat deployment, if one is configured."""
    if not AI4BHARAT_BASE:
        return None
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(f"{AI4BHARAT_BASE}{path}", json=payload)
        if resp.status_code == 200:
            return resp.json()
    except httpx.HTTPError:
        return None
    return None


# ------------------------------------------------------------------
@router.get("/status")
async def language_status():
    """What this deployment can actually do, per provider."""
    return {
        "bhashini_configured": _configured(),
        "ai4bharat_configured": bool(AI4BHARAT_BASE),
        "pipeline_id": PIPELINE_ID if _configured() else None,
        "scheduled_languages": sorted(SCHEDULED),
        "community_only_languages": COMMUNITY_ONLY,
        "note": (
            "Languages listed under community_only have no Bhashini or AI4Bharat model. "
            "SMIVAI serves them with bundled text and recorded prompts and says so in the interface."
        ),
    }


@router.post("/translate")
async def translate(body: TranslateIn, _: Actor = Depends(signed_in)):
    _guard(body.target)
    if body.source == body.target:
        return {"text": body.text, "provider": "none"}

    if _configured():
        pipe = await _resolve_pipeline(["translation"], body.source, body.target)
        result = await _compute(
            pipe,
            [{
                "taskType": "translation",
                "config": {
                    "language": {"sourceLanguage": body.source, "targetLanguage": body.target},
                    "serviceId": pipe["services"].get("translation"),
                },
            }],
            {"input": [{"source": body.text}]},
        )
        outputs = (result.get("pipelineResponse") or [{}])[0].get("output") or []
        target_text = (outputs[0] or {}).get("target") if outputs else None
        if target_text:
            return {"text": target_text, "provider": "bhashini"}

    fallback = await _ai4bharat(
        "/translate",
        {"text": body.text, "source_language": body.source, "target_language": body.target},
    )
    if fallback and (fallback.get("text") or fallback.get("translation")):
        return {"text": fallback.get("text") or fallback["translation"], "provider": "ai4bharat"}

    raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "No translation provider is available.")


@router.post("/tts")
async def tts(body: TtsIn, _: Actor = Depends(signed_in)):
    _guard(body.language)

    if _configured():
        pipe = await _resolve_pipeline(["tts"], body.language, None)
        result = await _compute(
            pipe,
            [{
                "taskType": "tts",
                "config": {
                    "language": {"sourceLanguage": body.language},
                    "serviceId": pipe["services"].get("tts"),
                    "gender": body.gender,
                    "samplingRate": 8000,
                },
            }],
            {"input": [{"source": body.text}]},
        )
        block = (result.get("pipelineResponse") or [{}])[0]
        audio = (block.get("audio") or [{}])[0]
        if audio.get("audioContent"):
            return {"audio_base64": audio["audioContent"], "provider": "bhashini"}

    fallback = await _ai4bharat(
        "/tts", {"text": body.text, "language": body.language, "gender": body.gender}
    )
    if fallback and (fallback.get("audio_base64") or fallback.get("audio")):
        return {
            "audio_base64": fallback.get("audio_base64") or fallback["audio"],
            "provider": "ai4bharat",
        }

    raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "No speech provider is available.")


@router.post("/asr")
async def asr(body: AsrIn, _: Actor = Depends(signed_in)):
    _guard(body.language)
    try:
        base64.b64decode(body.audio_base64, validate=True)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "audio_base64 is not valid base64.") from exc

    if _configured():
        pipe = await _resolve_pipeline(["asr"], body.language, None)
        result = await _compute(
            pipe,
            [{
                "taskType": "asr",
                "config": {
                    "language": {"sourceLanguage": body.language},
                    "serviceId": pipe["services"].get("asr"),
                    "audioFormat": "wav",
                    "samplingRate": 16000,
                },
            }],
            {"audio": [{"audioContent": body.audio_base64}]},
        )
        outputs = (result.get("pipelineResponse") or [{}])[0].get("output") or []
        text = (outputs[0] or {}).get("source") if outputs else None
        if text is not None:
            return {"text": text, "provider": "bhashini"}

    fallback = await _ai4bharat(
        "/asr", {"audio_base64": body.audio_base64, "language": body.language}
    )
    if fallback and (fallback.get("text") or fallback.get("transcript")):
        return {"text": fallback.get("text") or fallback["transcript"], "provider": "ai4bharat"}

    raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "No speech-recognition provider is available.")
