from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth.jwt_service import decode_access_token

security = HTTPBearer(auto_error=False)


class AuthUser:
    def __init__(self, user_id: str, email: str | None = None, name: str | None = None):
        self.user_id = user_id
        self.email = email
        self.name = name


async def verify_access_token(token: str) -> AuthUser:
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return AuthUser(user_id=user_id, email=payload.get("email"), name=payload.get("name"))


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> AuthUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required",
        )
    return await verify_access_token(credentials.credentials)


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> AuthUser | None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    return await verify_access_token(credentials.credentials)
