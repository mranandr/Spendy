from fastapi import APIRouter, Depends, HTTPException

from app.auth import AuthUser, get_current_user
from app.config import settings
from app.middleware.rate_limit import check_rate_limit
from app.models.schemas import BrokerStatusResponse, ZerodhaSyncResponse
from app.services import zerodha as zerodha_service
from app.services.supabase import delete_broker_token, get_broker_status, get_broker_token, upsert_broker_token

router = APIRouter(prefix="/brokers", tags=["brokers"])


@router.get("/status", response_model=BrokerStatusResponse)
async def status(user: AuthUser = Depends(get_current_user)):
    try:
        return get_broker_status(user.user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/zerodha/refresh", response_model=ZerodhaSyncResponse)
async def refresh_zerodha(user: AuthUser = Depends(get_current_user)):
    """Re-sync Zerodha using the encrypted token stored server-side."""
    await check_rate_limit(user.user_id, "broker_sync", settings.rate_limit_broker_sync_per_hour)

    token = get_broker_token(user.user_id, "zerodha")
    if not token:
        raise HTTPException(status_code=404, detail="Zerodha not connected")

    try:
        result = await zerodha_service.sync_zerodha(access_token=token)
        upsert_broker_token(user.user_id, "zerodha", result["accessToken"])
        return result
    except Exception as exc:
        delete_broker_token(user.user_id, "zerodha")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.delete("/{provider}")
async def disconnect(provider: str, user: AuthUser = Depends(get_current_user)):
    if provider not in ("zerodha", "groww"):
        raise HTTPException(status_code=400, detail="Invalid provider")
    delete_broker_token(user.user_id, provider)
    return {"ok": True}
