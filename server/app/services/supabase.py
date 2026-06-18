from datetime import datetime, timezone
from typing import Any

from supabase import Client, create_client

from app.config import settings
from app.services.encryption import get_encryptor

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError("Supabase service credentials not configured")
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


def upsert_broker_token(user_id: str, provider: str, access_token: str, metadata: dict | None = None) -> None:
    encryptor = get_encryptor()
    if encryptor is None:
        raise RuntimeError("BROKER_TOKEN_ENCRYPTION_KEY not configured")

    row: dict[str, Any] = {
        "user_id": user_id,
        "provider": provider,
        "access_token_enc": encryptor.encrypt(access_token),
        "metadata": metadata or {},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    get_supabase().table("broker_connections").upsert(row, on_conflict="user_id,provider").execute()


def get_broker_token(user_id: str, provider: str) -> str | None:
    encryptor = get_encryptor()
    if encryptor is None:
        return None

    result = (
        get_supabase()
        .table("broker_connections")
        .select("access_token_enc")
        .eq("user_id", user_id)
        .eq("provider", provider)
        .maybe_single()
        .execute()
    )
    data = result.data
    if not data or not data.get("access_token_enc"):
        return None
    return encryptor.decrypt(data["access_token_enc"])


def delete_broker_token(user_id: str, provider: str) -> None:
    get_supabase().table("broker_connections").delete().eq("user_id", user_id).eq(
        "provider", provider
    ).execute()


def get_broker_status(user_id: str) -> dict[str, bool]:
    result = (
        get_supabase()
        .table("broker_connections")
        .select("provider")
        .eq("user_id", user_id)
        .execute()
    )
    providers = {row["provider"] for row in (result.data or [])}
    return {"zerodha": "zerodha" in providers, "groww": "groww" in providers}


def fetch_user_finance_context(user_id: str) -> dict[str, Any]:
    """Load portfolio + recent transactions for AI orchestrator context."""
    sb = get_supabase()
    investments = (
        sb.table("investments").select("*").eq("user_id", user_id).limit(50).execute().data or []
    )
    transactions = (
        sb.table("transactions")
        .select("title, amount_paise, type, category_name, date")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .limit(20)
        .execute()
        .data
        or []
    )
    profile = (
        sb.table("users").select("display_name, preferred_currency").eq("id", user_id).maybe_single().execute().data
    )
    return {
        "profile": profile,
        "investments": investments,
        "recent_transactions": transactions,
    }
