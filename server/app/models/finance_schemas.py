from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AccountOut(BaseModel):
    id: str
    name: str
    type: Literal["savings", "credit", "investment", "wallet"]
    bank_name: str = Field(alias="bankName")
    balance_paise: int = Field(alias="balancePaise")

    model_config = {"populate_by_name": True}


class AccountCreate(BaseModel):
    name: str
    type: Literal["savings", "credit", "investment", "wallet"]
    bank_name: str = Field(alias="bankName")
    balance_paise: int = Field(default=0, alias="balancePaise")

    model_config = {"populate_by_name": True}


class TransactionOut(BaseModel):
    id: str
    title: str
    amount_paise: int = Field(alias="amountPaise")
    type: Literal["income", "expense", "transfer"]
    date: str
    category_icon: str = Field(alias="categoryIcon")
    category_color: str = Field(alias="categoryColor")
    category_name: str = Field(alias="categoryName")
    account_name: str = Field(alias="accountName")
    to_account_name: str | None = Field(default=None, alias="toAccountName")
    note: str | None = None

    model_config = {"populate_by_name": True}


class TransactionCreate(BaseModel):
    title: str
    amount_paise: int = Field(alias="amountPaise")
    type: Literal["income", "expense", "transfer"]
    date: str
    category_icon: str = Field(alias="categoryIcon")
    category_color: str = Field(alias="categoryColor")
    category_name: str = Field(alias="categoryName")
    account_name: str = Field(alias="accountName")
    to_account_name: str | None = Field(default=None, alias="toAccountName")
    note: str | None = None

    model_config = {"populate_by_name": True}


class BudgetOut(BaseModel):
    category_name: str = Field(alias="categoryName")
    category_icon: str = Field(alias="categoryIcon")
    category_color: str = Field(alias="categoryColor")
    budget_limit_paise: int = Field(alias="budgetLimitPaise")
    spent_amount_paise: int = Field(alias="spentAmountPaise")
    target_date: str = Field(alias="targetDate")

    model_config = {"populate_by_name": True}


class BudgetUpsert(BaseModel):
    category_name: str = Field(alias="categoryName")
    category_icon: str = Field(default="file-text", alias="categoryIcon")
    category_color: str = Field(default="#6C63FF", alias="categoryColor")
    budget_limit_paise: int = Field(alias="budgetLimitPaise")
    spent_amount_paise: int | None = Field(default=None, alias="spentAmountPaise")
    target_date: str | None = Field(default=None, alias="targetDate")

    model_config = {"populate_by_name": True}


class ScheduledPaymentOut(BaseModel):
    id: str
    name: str
    amount_paise: int = Field(alias="amountPaise")
    frequency: Literal["daily", "weekly", "monthly", "yearly"]
    next_due_date: str = Field(alias="nextDueDate")
    is_active: bool = Field(alias="isActive")

    model_config = {"populate_by_name": True}


class ScheduledPaymentCreate(BaseModel):
    name: str
    amount_paise: int = Field(alias="amountPaise")
    frequency: Literal["daily", "weekly", "monthly", "yearly"]
    next_due_date: str = Field(alias="nextDueDate")
    is_active: bool = Field(default=True, alias="isActive")

    model_config = {"populate_by_name": True}


class ScheduledPaymentPatch(BaseModel):
    is_active: bool | None = Field(default=None, alias="isActive")
    next_due_date: str | None = Field(default=None, alias="nextDueDate")

    model_config = {"populate_by_name": True}


class InvestmentOut(BaseModel):
    id: str
    provider: Literal["zerodha", "groww", "indmoney", "other"]
    holding_name: str = Field(alias="holdingName")
    current_value_paise: int = Field(alias="currentValuePaise")
    invested_value_paise: int = Field(alias="investedValuePaise")

    model_config = {"populate_by_name": True}


class FinanceSyncResponse(BaseModel):
    accounts: list[AccountOut]
    transactions: list[TransactionOut]
    budgets: list[BudgetOut]
    scheduled_payments: list[ScheduledPaymentOut] = Field(alias="scheduledPayments")
    investments: list[InvestmentOut]

    model_config = {"populate_by_name": True}
