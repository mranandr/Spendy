from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "ok": True,
        "zerodha": settings.zerodha_configured,
        "ai": settings.ai_configured,
        "database": bool(settings.supabase_url),
        "auth": bool(settings.jwt_secret) and settings.google_configured,
        "rateLimit": settings.rate_limit_enabled,
    }
