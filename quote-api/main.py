import os
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

app = FastAPI(title="SignFlow Quote Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = Path("quoting-assistant.md").read_text(encoding="utf-8")

MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY")
MINIMAX_BASE_URL = "https://api.minimax.io/anthropic/v1"

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

def build_prompt(messages: list[Message]) -> str:
    """Build a system-prompt–prefixed conversation string for the model."""
    parts = [f"{SYSTEM_PROMPT.strip()}\n\n"]
    for m in messages:
        parts.append(f"<{m.role}> {m.content}\n")
    parts.append("<assistant>")
    return "".join(parts)

@app.post("/quote")
async def quote(request: ChatRequest) -> dict:
    if not MINIMAX_API_KEY:
        raise HTTPException(status_code=500, detail="MINIMAX_API_KEY not set")

    prompt = build_prompt(request.messages)

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{MINIMAX_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {MINIMAX_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "MiniMax-M2.7",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 2048,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    return {"reply": content}

@app.get("/health")
async def health():
    return {"status": "ok"}
