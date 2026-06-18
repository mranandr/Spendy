from fastapi import APIRouter, Depends, HTTPException

from app.auth import AuthUser, get_current_user
from app.config import settings
from app.middleware.rate_limit import check_rate_limit
from app.models.schemas import GrowwSyncRequest, GrowwSyncResponse
from app.services import groww as groww_service
from app.services.supabase import upsert_broker_token

router = APIRouter(prefix="/groww", tags=["groww"])


@router.post("/sync", response_model=GrowwSyncResponse)
async def sync(body: GrowwSyncRequest, user: AuthUser = Depends(get_current_user)):
    await check_rate_limit(user.user_id, "broker_sync", settings.rate_limit_broker_sync_per_hour)

    try:
        result = await groww_service.sync_groww(access_token=body.access_token)
        if result.get("accessToken"):
            upsert_broker_token(user.user_id, "groww", result["accessToken"])
        return result
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
