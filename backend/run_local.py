"""Start the Smivai API for local development: `python backend/run_local.py`.

No SMS provider is connected, so sign-in codes are shown on screen
(labelled Demo mode). Settings already in the environment win; Razorpay
test keys, if you have them, go in the environment the same way
(see backend/.env.example and docs/CHARITY.md).
"""
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
os.environ.setdefault("SMIVAI_DEMO_OTP", "1")
sys.path.insert(0, str(HERE))

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=int(os.environ.get("SMIVAI_PORT", "8000")))
