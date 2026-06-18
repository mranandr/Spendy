from fastapi import APIRouter, Depends, HTTPException

from app.auth import AuthUser, get_current_user
from app.config import settings
from app.middleware.rate_limit import check_rate_limit
from app.models.schemas import AiInsightsRequest, AiInsightsResponse
from app.services.ai_orchestrator import generate_insights

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/insights", response_model=AiInsightsResponse)
async def insights(body: AiInsightsRequest, user: AuthUser = Depends(get_current_user)):
    await check_rate_limit(user.user_id, "ai_insights", settings.rate_limit_ai_per_hour)

    if not body.holdings:
        raise HTTPException(status_code=400, detail="No holdings to analyze")

    if not settings.ai_configured:
        raise HTTPException(status_code=503, detail="No AI provider configured on server")

    try:
        result = await generate_insights(body.provider, body.holdings, user_id=user.user_id)
        return result
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
