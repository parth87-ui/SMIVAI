"""SMIVAI — a small in-process rate limiter.

A sliding window per key, held in memory. That is enough for one local
process; several workers or servers would each keep their own counts, so a
real deployment would move this to a shared store (e.g. Redis). No new
dependency is needed for local development.
"""
from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, status


class RateLimiter:
    def __init__(self, limit: int, window_seconds: float):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key: str) -> None:
        """Count one request for `key`, or raise 429 if the window is full."""
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and now - q[0] >= self.window:
                q.popleft()
            if len(q) >= self.limit:
                retry = max(1, int(self.window - (now - q[0])) + 1)
                raise HTTPException(
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "Too many attempts. Please wait a little and try again.",
                    headers={"Retry-After": str(retry)},
                )
            q.append(now)
            if len(self._hits) > 50_000:          # bound memory: drop idle keys
                for k in [k for k, v in self._hits.items() if not v]:
                    del self._hits[k]

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


ALL: list[RateLimiter] = []


def limiter(limit: int, window_seconds: float) -> RateLimiter:
    rl = RateLimiter(limit, window_seconds)
    ALL.append(rl)
    return rl


def reset_all() -> None:
    """For tests."""
    for rl in ALL:
        rl.reset()
