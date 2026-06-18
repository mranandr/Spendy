from typing import Literal

from pydantic import BaseModel, Field


class Investment(BaseModel):
    id: str | None = None
    provider: Literal["zerodha", "groww", "indmoney", "other"]
    holding_name: str = Field(alias="holdingName")
    current_value_paise: int = Field(alias="currentValuePaise")
    invested_value_paise: int = Field(alias="investedValuePaise")

    model_config = {"populate_by_name": True}


class PortfolioSummary(BaseModel):
    total_value_paise: int = Field(alias="totalValuePaise")
    total_invested_paise: int = Field(alias="totalInvestedPaise")
    total_gains_paise: int = Field(alias="totalGainsPaise")
    gains_percent: float = Field(alias="gainsPercent")

    model_config = {"populate_by_name": True}


class ZerodhaSyncRequest(BaseModel):
    request_token: str | None = Field(default=None, alias="requestToken")
    access_token: str | None = Field(default=None, alias="accessToken")

    model_config = {"populate_by_name": True}


class ZerodhaSyncResponse(BaseModel):
    access_token: str = Field(alias="accessToken")
    user_id: str | None = Field(default=None, alias="userId")
    holdings: list[Investment]
    summary: PortfolioSummary

    model_config = {"populate_by_name": True}


class GrowwSyncRequest(BaseModel):
    access_token: str | None = Field(default=None, alias="accessToken")

    model_config = {"populate_by_name": True}


class GrowwSyncResponse(BaseModel):
    access_token: str | None = Field(default=None, alias="accessToken")
    holdings: list[Investment]
    summary: PortfolioSummary
    auth_mode: str | None = Field(default=None, alias="authMode")

    model_config = {"populate_by_name": True}


class AiInsightsRequest(BaseModel):
    provider: Literal["claude", "gemini"]
    holdings: list[Investment] = Field(default_factory=list)


class AiInsightsResponse(BaseModel):
    provider: Literal["claude", "gemini"]
    model: str
    text: str


class BrokerStatusResponse(BaseModel):
    zerodha: bool
    groww: bool
    last_synced_at: str | None = Field(default=None, alias="lastSyncedAt")

    model_config = {"populate_by_name": True}
