"""User and refresh-token persistence (Postgres via service role)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status

from app.config import settings
from app.services.auth.security import (
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.services.auth.validators import ACCOUNT_LOCKED_ERROR, GENERIC_AUTH_ERROR, normalize_email
from app.services.supabase import get_supabase

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
REFRESH_TOKEN_DAYS = 7


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _user_out(row: dict[str, Any]) -> dict[str, Any]:
    created = row.get("created_at")
    joined = created
    if isinstance(created, str):
        try:
            joined = datetime.fromisoformat(created.replace("Z", "+00:00"))
        except ValueError:
            joined = _now()
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row.get("display_name") or row["email"].split("@")[0],
        "avatar": row.get("avatar_url"),
        "preferredCurrency": row.get("preferred_currency") or "INR",
        "joinedDate": joined.strftime("%B %Y") if isinstance(joined, datetime) else str(joined),
        "emailVerified": bool(row.get("email_verified")),
    }


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    row = (
        get_supabase().table("users").select("*").eq("id", user_id).maybe_single().execute().data
    )
    return _user_out(row) if row else None


def get_user_by_email(email: str) -> dict[str, Any] | None:
    normalized = normalize_email(email)
    row = (
        get_supabase()
        .table("users")
        .select("*")
        .eq("email_normalized", normalized)
        .maybe_single()
        .execute()
        .data
    )
    return row


def _is_locked(row: dict[str, Any]) -> bool:
    locked_until = row.get("locked_until")
    if not locked_until:
        return False
    if isinstance(locked_until, str):
        locked_until = datetime.fromisoformat(locked_until.replace("Z", "+00:00"))
    return locked_until > _now()


def register_user(*, email: str, password: str, name: str) -> dict[str, Any]:
    normalized = normalize_email(email)
    existing = get_user_by_email(normalized)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_id = str(uuid4())
    now = _now().isoformat()
    row = {
        "id": user_id,
        "email": normalized,
        "email_normalized": normalized,
        "password_hash": hash_password(password),
        "display_name": name,
        "preferred_currency": "INR",
        "email_verified": False,
        "failed_login_attempts": 0,
        "created_at": now,
        "updated_at": now,
    }
    result = get_supabase().table("users").insert(row).execute()
    data = (result.data or [None])[0]
    if not data:
        raise HTTPException(status_code=500, detail="Registration failed")
    return _user_out(data)


def authenticate_user(*, email: str, password: str) -> dict[str, Any]:
    normalized = normalize_email(email)
    row = get_user_by_email(normalized)
    if not row or not row.get("password_hash"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_AUTH_ERROR)

    if _is_locked(row):
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail=ACCOUNT_LOCKED_ERROR)

    if not verify_password(password, row["password_hash"]):
        attempts = int(row.get("failed_login_attempts") or 0) + 1
        patch: dict[str, Any] = {
            "failed_login_attempts": attempts,
            "updated_at": _now().isoformat(),
        }
        if attempts >= MAX_FAILED_ATTEMPTS:
            patch["locked_until"] = (_now() + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
        get_supabase().table("users").update(patch).eq("id", row["id"]).execute()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_AUTH_ERROR)

    get_supabase().table("users").update(
        {
            "failed_login_attempts": 0,
            "locked_until": None,
            "last_login_at": _now().isoformat(),
            "updated_at": _now().isoformat(),
        }
    ).eq("id", row["id"]).execute()

    return _user_out(row)


def upsert_google_user(*, google_sub: str, email: str, name: str, avatar: str | None, email_verified: bool) -> dict[str, Any]:
    normalized = normalize_email(email)
    sb = get_supabase()

    by_google = (
        sb.table("users").select("*").eq("google_sub", google_sub).maybe_single().execute().data
    )
    if by_google:
        sb.table("users").update(
            {
                "display_name": name,
                "avatar_url": avatar,
                "email_verified": email_verified or by_google.get("email_verified"),
                "last_login_at": _now().isoformat(),
                "updated_at": _now().isoformat(),
            }
        ).eq("id", by_google["id"]).execute()
        refreshed = sb.table("users").select("*").eq("id", by_google["id"]).maybe_single().execute().data
        return _user_out(refreshed or by_google)

    by_email = get_user_by_email(normalized)
    if by_email:
        sb.table("users").update(
            {
                "google_sub": google_sub,
                "display_name": name,
                "avatar_url": avatar,
                "email_verified": email_verified or by_email.get("email_verified"),
                "last_login_at": _now().isoformat(),
                "updated_at": _now().isoformat(),
            }
        ).eq("id", by_email["id"]).execute()
        refreshed = sb.table("users").select("*").eq("id", by_email["id"]).maybe_single().execute().data
        return _user_out(refreshed or by_email)

    user_id = str(uuid4())
    now = _now().isoformat()
    row = {
        "id": user_id,
        "email": normalized,
        "email_normalized": normalized,
        "google_sub": google_sub,
        "display_name": name,
        "avatar_url": avatar,
        "preferred_currency": "INR",
        "email_verified": email_verified,
        "failed_login_attempts": 0,
        "created_at": now,
        "updated_at": now,
        "last_login_at": now,
    }
    result = sb.table("users").insert(row).execute()
    data = (result.data or [None])[0]
    if not data:
        raise HTTPException(status_code=500, detail="Google sign-in failed")
    return _user_out(data)


def issue_refresh_token(user_id: str) -> str:
    plain = generate_refresh_token()
    expires = _now() + timedelta(days=REFRESH_TOKEN_DAYS)
    get_supabase().table("refresh_tokens").insert(
        {
            "user_id": user_id,
            "token_hash": hash_refresh_token(plain),
            "expires_at": expires.isoformat(),
        }
    ).execute()
    return plain


def rotate_refresh_token(plain_token: str) -> tuple[str, dict[str, Any]]:
    token_hash = hash_refresh_token(plain_token)
    sb = get_supabase()
    row = (
        sb.table("refresh_tokens")
        .select("*")
        .eq("token_hash", token_hash)
        .is_("revoked_at", "null")
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    expires = row.get("expires_at")
    if isinstance(expires, str):
        expires_dt = datetime.fromisoformat(expires.replace("Z", "+00:00"))
    else:
        expires_dt = expires
    if expires_dt and expires_dt < _now():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    sb.table("refresh_tokens").update({"revoked_at": _now().isoformat()}).eq("id", row["id"]).execute()

    user = get_user_by_id(row["user_id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    new_refresh = issue_refresh_token(row["user_id"])
    return new_refresh, user


def revoke_refresh_token(plain_token: str) -> None:
    token_hash = hash_refresh_token(plain_token)
    get_supabase().table("refresh_tokens").update({"revoked_at": _now().isoformat()}).eq(
        "token_hash", token_hash
    ).execute()


def revoke_all_refresh_tokens(user_id: str) -> None:
    get_supabase().table("refresh_tokens").update({"revoked_at": _now().isoformat()}).eq(
        "user_id", user_id
    ).is_("revoked_at", "null").execute()
