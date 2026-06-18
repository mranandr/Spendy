"""OWASP-aligned input validation for authentication."""

from __future__ import annotations

import re
from typing import Final

from fastapi import HTTPException, status

EMAIL_RE: Final[re.Pattern[str]] = re.compile(
    r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
)
# OWASP: min 12 chars, upper, lower, digit, special
PASSWORD_RE: Final[re.Pattern[str]] = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$"
)
DISPLAY_NAME_RE: Final[re.Pattern[str]] = re.compile(r"^[\w\s.\-']{1,80}$", re.UNICODE)

GENERIC_AUTH_ERROR = "Invalid email or password"
ACCOUNT_LOCKED_ERROR = "Account temporarily locked. Try again later."


def normalize_email(email: str) -> str:
    cleaned = email.strip().lower()
    if not cleaned or len(cleaned) > 254:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address")
    if not EMAIL_RE.match(cleaned):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address")
    return cleaned


def validate_password(password: str) -> str:
    if not password or len(password) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be 12–128 characters with upper, lower, digit, and symbol",
        )
    if not PASSWORD_RE.match(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be 12–128 characters with upper, lower, digit, and symbol",
        )
    return password


def validate_display_name(name: str) -> str:
    cleaned = name.strip()
    if not cleaned or not DISPLAY_NAME_RE.match(cleaned):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid display name")
    return cleaned


def validate_redirect_uri(uri: str, allowed: list[str]) -> str:
    cleaned = uri.strip()
    if not cleaned or cleaned not in allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid redirect URI")
    return cleaned
