from fastapi import APIRouter, Depends, HTTPException

from app.auth import AuthUser, get_current_user
from app.middleware.rate_limit import check_rate_limit
from app.config import settings
from app.models.schemas import ZerodhaSyncRequest, ZerodhaSyncResponse
from app.services import zerodha as zerodha_service
from app.services.supabase import upsert_broker_token

router = APIRouter(prefix="/zerodha", tags=["zerodha"])


@router.get("/login-url")
async def login_url(user: AuthUser = Depends(get_current_user)):
    try:
        return zerodha_service.get_login_url()
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/sync", response_model=ZerodhaSyncResponse)
async def sync(body: ZerodhaSyncRequest, user: AuthUser = Depends(get_current_user)):
    await check_rate_limit(user.user_id, "broker_sync", settings.rate_limit_broker_sync_per_hour)

    try:
        if body.request_token:
            result = await zerodha_service.sync_zerodha(request_token=body.request_token)
        elif body.access_token:
            result = await zerodha_service.sync_zerodha(access_token=body.access_token)
        else:
            raise HTTPException(status_code=400, detail="requestToken or accessToken required")

        upsert_broker_token(
            user.user_id,
            "zerodha",
            result["accessToken"],
            {"kiteUserId": result.get("userId")},
        )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
