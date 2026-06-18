import json
from typing import Any, Literal

import httpx

from app.config import settings
from app.models.schemas import Investment
from app.services.supabase import fetch_user_finance_context

SYSTEM_PROMPT = """You are ExpenseIQ portfolio analyst. Provide concise, educational insights only.
Never give specific buy/sell advice. Use INR. Reference allocation, diversification, and risk briefly."""


def _build_context(
    holdings: list[Investment],
    finance_ctx: dict[str, Any] | None,
) -> str:
    holdings_json = [h.model_dump(by_alias=True) for h in holdings]
    parts = [f"Holdings:\n{json.dumps(holdings_json, indent=2)}"]
    if finance_ctx:
        if finance_ctx.get("profile"):
            parts.append(f"User profile:\n{json.dumps(finance_ctx['profile'], indent=2)}")
        if finance_ctx.get("recent_transactions"):
            parts.append(
                f"Recent transactions:\n{json.dumps(finance_ctx['recent_transactions'], indent=2)}"
            )
        if finance_ctx.get("investments") and not holdings:
            parts.append(
                f"Stored investments:\n{json.dumps(finance_ctx['investments'], indent=2)}"
            )
    return "\n\n".join(parts)


async def _call_openrouter(model: str, user_content: str) -> tuple[str, str]:
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY not configured")
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        text = data["choices"][0]["message"]["content"]
        return text, model


async def _call_anthropic(user_content: str) -> tuple[str, str]:
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY not configured")
    model = settings.ai_claude_model.replace("anthropic/", "")
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 1024,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_content}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        text = data["content"][0]["text"]
        return text, model


async def _call_google(user_content: str) -> tuple[str, str]:
    if not settings.google_api_key:
        raise ValueError("GOOGLE_API_KEY not configured")
    model = settings.ai_gemini_model.replace("google/", "")
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": settings.google_api_key},
            json={
                "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [{"role": "user", "parts": [{"text": user_content}]}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return text, model


async def generate_insights(
    provider: Literal["claude", "gemini"],
    holdings: list[Investment],
    user_id: str | None = None,
) -> dict[str, str]:
    finance_ctx = fetch_user_finance_context(user_id) if user_id else None
    user_content = _build_context(holdings, finance_ctx)

    if settings.openrouter_api_key:
        model = settings.ai_claude_model if provider == "claude" else settings.ai_gemini_model
        text, used_model = await _call_openrouter(model, user_content)
        return {"provider": provider, "model": used_model, "text": text}

    if provider == "claude":
        text, model = await _call_anthropic(user_content)
    else:
        text, model = await _call_google(user_content)

    return {"provider": provider, "model": model, "text": text}
