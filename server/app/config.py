from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 5050
    cors_origins: str = "*"

    # Postgres (Supabase service role — data layer only, not auth)
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # JWT (Keycloak-style local verification — OWASP JWT cheat sheet)
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "spendy-api"
    jwt_audience: str = "spendy-client"
    jwt_access_token_minutes: int = 15

    # Google OAuth 2.0 (service provider)
    google_client_id: str = ""
    google_client_secret: str = ""
    oauth_redirect_uris: str = ""

    broker_token_encryption_key: str = ""

    kite_api_key: str = ""
    kite_api_secret: str = ""
    kite_redirect_url: str = "spendy://zerodha"

    groww_api_key: str = ""
    groww_api_secret: str = ""

    openrouter_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""
    ai_claude_model: str = "anthropic/claude-sonnet-4"
    ai_gemini_model: str = "google/gemini-2.0-flash"

    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""
    rate_limit_ai_per_hour: int = 20
    rate_limit_broker_sync_per_hour: int = 30

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def zerodha_configured(self) -> bool:
        return bool(self.kite_api_key and self.kite_api_secret)

    @property
    def ai_configured(self) -> bool:
        return bool(self.openrouter_api_key or self.anthropic_api_key or self.google_api_key)

    @property
    def groww_configured(self) -> bool:
        return bool(self.groww_api_key and self.groww_api_secret)

    @property
    def rate_limit_enabled(self) -> bool:
        return bool(self.upstash_redis_rest_url and self.upstash_redis_rest_token)

    @property
    def oauth_redirect_uri_list(self) -> list[str]:
        raw = self.oauth_redirect_uris.strip()
        if not raw:
            return []
        return [u.strip() for u in raw.split(",") if u.strip()]

    @property
    def google_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)


settings = Settings()
