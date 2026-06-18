import uuid
from typing import Any

import httpx

from app.config import settings
from app.models.schemas import Investment, PortfolioSummary

GROWW_BASE = "https://api.groww.in"


def _summary(holdings: list[Investment]) -> PortfolioSummary:
    total_value = sum(h.current_value_paise for h in holdings)
    total_invested = sum(h.invested_value_paise for h in holdings)
    gains = total_value - total_invested
    pct = (gains / total_invested * 100) if total_invested > 0 else 0.0
    return PortfolioSummary(
        totalValuePaise=total_value,
        totalInvestedPaise=total_invested,
        totalGainsPaise=gains,
        gainsPercent=round(pct, 2),
    )


async def _resolve_access_token(pasted_token: str | None) -> tuple[str, str]:
    """Returns (access_token, auth_mode)."""
    if pasted_token:
        return pasted_token, "access_token"
    if not settings.groww_configured:
        raise ValueError(
            "Groww not configured. Set GROWW_API_KEY/SECRET on server or paste an access token."
        )
    # Groww checksum auth — daily approval required in Groww Cloud
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{GROWW_BASE}/v1/token/api/access",
            json={
                "api_key": settings.groww_api_key,
                "api_secret": settings.groww_api_secret,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        token = data.get("access_token") or data.get("data", {}).get("access_token")
        if not token:
            raise ValueError("Groww token exchange failed — approve API key for today in Groww Cloud")
        return token, "api_key"


async def fetch_holdings(access_token: str) -> list[Investment]:
    headers = {"Authorization": f"Bearer {access_token}"}
    holdings: list[Investment] = []

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{GROWW_BASE}/v1/holdings/user", headers=headers)
        resp.raise_for_status()
        payload = resp.json()
        rows = payload.get("data", payload) if isinstance(payload, dict) else payload
        if not isinstance(rows, list):
            rows = rows.get("holdings", []) if isinstance(rows, dict) else []

        for row in rows:
            symbol = row.get("trading_symbol") or row.get("symbol") or row.get("scheme_name") or "Holding"
            qty = float(row.get("quantity", 0) or row.get("total_units", 0) or 0)
            avg = float(row.get("average_price", 0) or row.get("avg_price", 0) or 0)
            holdings.append(
                Investment(
                    id=f"groww-{symbol}-{uuid.uuid4().hex[:6]}",
                    provider="groww",
                    holdingName=symbol,
                    currentValuePaise=int(qty * avg * 100),
                    investedValuePaise=int(qty * avg * 100),
                )
            )

    return holdings


async def sync_groww(access_token: str | None = None) -> dict[str, Any]:
    token, auth_mode = await _resolve_access_token(access_token)
    holdings = await fetch_holdings(token)
    return {
        "accessToken": token,
        "holdings": holdings,
        "summary": _summary(holdings),
        "authMode": auth_mode,
    }
