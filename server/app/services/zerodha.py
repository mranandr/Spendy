import hashlib
import uuid
from typing import Any

import httpx

from app.config import settings
from app.models.schemas import Investment, PortfolioSummary

KITE_BASE = "https://api.kite.trade"


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


def get_login_url() -> dict[str, str]:
    if not settings.zerodha_configured:
        raise ValueError("Zerodha (Kite) API credentials not configured on server")
    login_url = (
        f"https://kite.zerodha.com/connect/login?api_key={settings.kite_api_key}&v=3"
    )
    return {"loginUrl": login_url, "redirectUrl": settings.kite_redirect_url}


async def exchange_request_token(request_token: str) -> tuple[str, str | None]:
    checksum = hashlib.sha256(
        f"{settings.kite_api_key}{request_token}{settings.kite_api_secret}".encode()
    ).hexdigest()
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{KITE_BASE}/session/token",
            data={
                "api_key": settings.kite_api_key,
                "request_token": request_token,
                "checksum": checksum,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("status") != "success":
            raise ValueError(data.get("message", "Kite session exchange failed"))
        session = data["data"]
        return session["access_token"], session.get("user_id")


async def fetch_holdings(access_token: str) -> list[Investment]:
    headers = {"Authorization": f"token {settings.kite_api_key}:{access_token}"}
    holdings: list[Investment] = []

    async with httpx.AsyncClient(timeout=30) as client:
        eq_resp = await client.get(f"{KITE_BASE}/portfolio/holdings", headers=headers)
        eq_resp.raise_for_status()
        eq_data = eq_resp.json()
        if eq_data.get("status") == "success":
            for row in eq_data.get("data", []):
                qty = float(row.get("quantity", 0) or 0)
                ltp = float(row.get("last_price", 0) or row.get("average_price", 0) or 0)
                avg = float(row.get("average_price", 0) or 0)
                holdings.append(
                    Investment(
                        id=f"zerodha-{row.get('tradingsymbol', uuid.uuid4().hex[:8])}",
                        provider="zerodha",
                        holdingName=row.get("tradingsymbol", "Unknown"),
                        currentValuePaise=int(qty * ltp * 100),
                        investedValuePaise=int(qty * avg * 100),
                    )
                )

        try:
            mf_resp = await client.get(f"{KITE_BASE}/mf/holdings", headers=headers)
            mf_resp.raise_for_status()
            mf_data = mf_resp.json()
            if mf_data.get("status") == "success":
                for row in mf_data.get("data", []):
                    qty = float(row.get("quantity", 0) or 0)
                    nav = float(row.get("last_price", 0) or row.get("average_price", 0) or 0)
                    avg = float(row.get("average_price", 0) or 0)
                    holdings.append(
                        Investment(
                            id=f"zerodha-mf-{row.get('fund', uuid.uuid4().hex[:8])}",
                            provider="zerodha",
                            holdingName=row.get("fund", "MF Holding"),
                            currentValuePaise=int(qty * nav * 100),
                            investedValuePaise=int(qty * avg * 100),
                        )
                    )
        except httpx.HTTPError:
            pass

    return holdings


async def sync_zerodha(
    *,
    request_token: str | None = None,
    access_token: str | None = None,
) -> dict[str, Any]:
    user_id: str | None = None
    if request_token:
        access_token, user_id = await exchange_request_token(request_token)
    if not access_token:
        raise ValueError("requestToken or accessToken required")

    holdings = await fetch_holdings(access_token)
    return {
        "accessToken": access_token,
        "userId": user_id,
        "holdings": holdings,
        "summary": _summary(holdings),
    }
