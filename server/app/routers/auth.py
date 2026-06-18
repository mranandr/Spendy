from fastapi import APIRouter, Depends, Query

from app.auth import AuthUser, get_current_user
from app.config import settings
from app.models.auth_schemas import (
    GoogleAuthUrlResponse,
    GoogleCallbackRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.services.auth.google_oauth import build_google_authorize_url, exchange_google_code
from app.services.auth.jwt_service import create_access_token, create_oauth_state, verify_oauth_state
from app.services.auth.user_service import (
    authenticate_user,
    issue_refresh_token,
    register_user,
    revoke_all_refresh_tokens,
    revoke_refresh_token,
    rotate_refresh_token,
    upsert_google_user,
)
from app.services.auth.validators import validate_display_name, validate_password, validate_redirect_uri

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: dict, refresh_token: str) -> TokenResponse:
    access = create_access_token(user_id=user["id"], email=user["email"], name=user.get("name"))
    return TokenResponse(
        access_token=access,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_minutes * 60,
        user=UserOut(**user),
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest) -> TokenResponse:
    password = validate_password(body.password)
    name = validate_display_name(body.name)
    user = register_user(email=str(body.email), password=password, name=name)
    refresh = issue_refresh_token(user["id"])
    return _token_response(user, refresh)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest) -> TokenResponse:
    user = authenticate_user(email=body.email, password=body.password)
    refresh = issue_refresh_token(user["id"])
    return _token_response(user, refresh)


@router.get("/google/url", response_model=GoogleAuthUrlResponse)
def google_auth_url(
    redirect_uri: str = Query(..., min_length=1, max_length=2048),
) -> GoogleAuthUrlResponse:
    allowed = settings.oauth_redirect_uri_list
    safe_uri = validate_redirect_uri(redirect_uri, allowed)
    state = create_oauth_state(redirect_uri=safe_uri)
    url = build_google_authorize_url(redirect_uri=safe_uri, state=state)
    return GoogleAuthUrlResponse(url=url, state=state)


@router.post("/google/callback", response_model=TokenResponse)
async def google_callback(body: GoogleCallbackRequest) -> TokenResponse:
    allowed = settings.oauth_redirect_uri_list
    safe_uri = validate_redirect_uri(body.redirect_uri, allowed)
    verify_oauth_state(body.state, safe_uri)
    profile = await exchange_google_code(code=body.code, redirect_uri=safe_uri)
    user = upsert_google_user(
        google_sub=profile["google_sub"],
        email=profile["email"],
        name=profile["name"],
        avatar=profile.get("avatar"),
        email_verified=profile["email_verified"],
    )
    refresh = issue_refresh_token(user["id"])
    return _token_response(user, refresh)


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(body: RefreshRequest) -> TokenResponse:
    new_refresh, user = rotate_refresh_token(body.refresh_token)
    return _token_response(user, new_refresh)


@router.post("/logout", status_code=204)
def logout(
    body: LogoutRequest,
    user: AuthUser = Depends(get_current_user),
) -> None:
    if body.refresh_token:
        revoke_refresh_token(body.refresh_token)
    else:
        revoke_all_refresh_tokens(user.user_id)


@router.get("/me", response_model=UserOut)
def me(user: AuthUser = Depends(get_current_user)) -> UserOut:
    from app.services.auth.user_service import get_user_by_id

    profile = get_user_by_id(user.user_id)
    if not profile:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserOut(**profile)
