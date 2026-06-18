"""JWT access tokens — Keycloak-style claims with local verification (OWASP JWT cheat sheet)."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.config import settings

ALLOWED_ALGORITHMS = ["HS256"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _require_jwt_secret() -> str:
    secret = settings.jwt_secret.strip()
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET must be at least 32 characters")
    return secret


def create_access_token(*, user_id: str, email: str, name: str | None) -> str:
    now = _now()
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_access_token_minutes)).timestamp()),
        "jti": str(uuid.uuid4()),
        "typ": "access",
    }
    return jwt.encode(payload, _require_jwt_secret(), algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            _require_jwt_secret(),
            algorithms=ALLOWED_ALGORITHMS,
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            options={"require_exp": True, "require_iat": True, "require_sub": True},
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        ) from exc

    if payload.get("typ") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    return payload


def create_oauth_state(*, redirect_uri: str) -> str:
    """Signed CSRF state for Google OAuth (short-lived)."""
    now = _now()
    payload = {
        "redirect_uri": redirect_uri,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=10)).timestamp()),
        "typ": "oauth_state",
        "nonce": str(uuid.uuid4()),
    }
    return jwt.encode(payload, _require_jwt_secret(), algorithm=settings.jwt_algorithm)


def verify_oauth_state(state: str, redirect_uri: str) -> None:
    try:
        payload = jwt.decode(
            state,
            _require_jwt_secret(),
            algorithms=ALLOWED_ALGORITHMS,
            options={"require_exp": True},
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state") from exc

    if payload.get("typ") != "oauth_state":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")
    if payload.get("redirect_uri") != redirect_uri:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth redirect mismatch")
