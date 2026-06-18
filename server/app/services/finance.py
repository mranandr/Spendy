from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from app.services.supabase import get_supabase


def _iso(dt: Any) -> str:
    if isinstance(dt, str):
        return dt
    if isinstance(dt, datetime):
        return dt.astimezone(timezone.utc).isoformat()
    return str(dt)


def _account_out(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "type": row["type"],
        "bankName": row["bank_name"],
        "balancePaise": row["balance_paise"],
    }


def _transaction_out(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "title": row["title"],
        "amountPaise": row["amount_paise"],
        "type": row["type"],
        "date": _iso(row["date"]),
        "categoryIcon": row["category_icon"],
        "categoryColor": row["category_color"],
        "categoryName": row["category_name"],
        "accountName": row["account_name"],
        "toAccountName": row.get("to_account_name"),
        "note": row.get("note"),
    }


def _budget_out(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "categoryName": row["category_name"],
        "categoryIcon": row["category_icon"],
        "categoryColor": row["category_color"],
        "budgetLimitPaise": row["budget_limit_paise"],
        "spentAmountPaise": row["spent_amount_paise"],
        "targetDate": _iso(row["target_date"]) if row.get("target_date") else datetime.now(timezone.utc).isoformat(),
    }


def _scheduled_out(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "amountPaise": row["amount_paise"],
        "frequency": row["frequency"],
        "nextDueDate": _iso(row["next_due_date"]),
        "isActive": row["is_active"],
    }


def _investment_out(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "provider": row["provider"],
        "holdingName": row["holding_name"],
        "currentValuePaise": row["current_value_paise"],
        "investedValuePaise": row["invested_value_paise"],
    }


def sync_user_finance(user_id: str) -> dict[str, Any]:
    sb = get_supabase()
    accounts = sb.table("accounts").select("*").eq("user_id", user_id).order("created_at").execute().data or []
    transactions = (
        sb.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .execute()
        .data
        or []
    )
    budgets = sb.table("budgets").select("*").eq("user_id", user_id).execute().data or []
    scheduled = (
        sb.table("scheduled_payments").select("*").eq("user_id", user_id).order("next_due_date").execute().data or []
    )
    investments = sb.table("investments").select("*").eq("user_id", user_id).execute().data or []

    return {
        "accounts": [_account_out(r) for r in accounts],
        "transactions": [_transaction_out(r) for r in transactions],
        "budgets": [_budget_out(r) for r in budgets],
        "scheduledPayments": [_scheduled_out(r) for r in scheduled],
        "investments": [_investment_out(r) for r in investments],
    }


def list_accounts(user_id: str) -> list[dict[str, Any]]:
    rows = get_supabase().table("accounts").select("*").eq("user_id", user_id).order("created_at").execute().data or []
    return [_account_out(r) for r in rows]


def create_account(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    row = {
        "user_id": user_id,
        "name": payload["name"],
        "type": payload["type"],
        "bank_name": payload["bankName"],
        "balance_paise": payload.get("balancePaise", 0),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = get_supabase().table("accounts").insert(row).execute()
    data = (result.data or [None])[0]
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create account")
    return _account_out(data)


def delete_account(user_id: str, account_id: str) -> None:
    sb = get_supabase()
    existing = (
        sb.table("accounts").select("id").eq("user_id", user_id).eq("id", account_id).maybe_single().execute().data
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")
    sb.table("accounts").delete().eq("user_id", user_id).eq("id", account_id).execute()


def _adjust_account_balance(user_id: str, account_name: str, delta_paise: int) -> None:
    sb = get_supabase()
    account = (
        sb.table("accounts")
        .select("id, balance_paise")
        .eq("user_id", user_id)
        .eq("name", account_name)
        .maybe_single()
        .execute()
        .data
    )
    if not account:
        return
    sb.table("accounts").update(
        {
            "balance_paise": account["balance_paise"] + delta_paise,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", account["id"]).execute()


def _apply_transaction_to_account(
    user_id: str,
    account_name: str,
    amount_paise: int,
    tx_type: str,
    reverse: bool = False,
    to_account_name: str | None = None,
) -> None:
    if tx_type == "transfer":
        direction = -1 if not reverse else 1
        _adjust_account_balance(user_id, account_name, amount_paise * direction)
        if to_account_name:
            _adjust_account_balance(user_id, to_account_name, amount_paise * (-direction))
        return

    factor = 1 if tx_type == "income" else -1
    if reverse:
        factor *= -1
    _adjust_account_balance(user_id, account_name, amount_paise * factor)


def _apply_transaction_to_budget(user_id: str, category_name: str, amount_paise: int, reverse: bool = False) -> None:
    sb = get_supabase()
    budget = (
        sb.table("budgets")
        .select("id, spent_amount_paise")
        .eq("user_id", user_id)
        .eq("category_name", category_name)
        .maybe_single()
        .execute()
        .data
    )
    if not budget:
        return
    delta = -amount_paise if reverse else amount_paise
    spent = max(0, budget["spent_amount_paise"] + delta)
    sb.table("budgets").update({"spent_amount_paise": spent}).eq("id", budget["id"]).execute()


def list_transactions(user_id: str) -> list[dict[str, Any]]:
    rows = (
        get_supabase()
        .table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .execute()
        .data
        or []
    )
    return [_transaction_out(r) for r in rows]


def create_transaction(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    row = {
        "user_id": user_id,
        "title": payload["title"],
        "amount_paise": payload["amountPaise"],
        "type": payload["type"],
        "date": payload["date"],
        "category_icon": payload["categoryIcon"],
        "category_color": payload["categoryColor"],
        "category_name": payload["categoryName"],
        "account_name": payload["accountName"],
        "to_account_name": payload.get("toAccountName"),
        "note": payload.get("note"),
    }
    result = get_supabase().table("transactions").insert(row).execute()
    data = (result.data or [None])[0]
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create transaction")

    _apply_transaction_to_account(
        user_id,
        payload["accountName"],
        payload["amountPaise"],
        payload["type"],
        to_account_name=payload.get("toAccountName"),
    )
    if payload["type"] == "expense":
        _apply_transaction_to_budget(user_id, payload["categoryName"], payload["amountPaise"])

    return _transaction_out(data)


def delete_transaction(user_id: str, transaction_id: str) -> None:
    sb = get_supabase()
    existing = (
        sb.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .eq("id", transaction_id)
        .maybe_single()
        .execute()
        .data
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")

    _apply_transaction_to_account(
        user_id,
        existing["account_name"],
        existing["amount_paise"],
        existing["type"],
        reverse=True,
        to_account_name=existing.get("to_account_name"),
    )
    if existing["type"] == "expense":
        _apply_transaction_to_budget(user_id, existing["category_name"], existing["amount_paise"], reverse=True)

    sb.table("transactions").delete().eq("user_id", user_id).eq("id", transaction_id).execute()


def list_budgets(user_id: str) -> list[dict[str, Any]]:
    rows = get_supabase().table("budgets").select("*").eq("user_id", user_id).execute().data or []
    return [_budget_out(r) for r in rows]


def upsert_budget(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    target_date = payload.get("targetDate") or datetime.now(timezone.utc).isoformat()
    row = {
        "user_id": user_id,
        "category_name": payload["categoryName"],
        "category_icon": payload.get("categoryIcon", "file-text"),
        "category_color": payload.get("categoryColor", "#6C63FF"),
        "budget_limit_paise": payload["budgetLimitPaise"],
        "spent_amount_paise": payload.get("spentAmountPaise", 0),
        "target_date": target_date,
    }
    result = get_supabase().table("budgets").upsert(row, on_conflict="user_id,category_name").execute()
    data = (result.data or [None])[0]
    if not data:
        refreshed = (
            get_supabase()
            .table("budgets")
            .select("*")
            .eq("user_id", user_id)
            .eq("category_name", payload["categoryName"])
            .maybe_single()
            .execute()
            .data
        )
        if not refreshed:
            raise HTTPException(status_code=500, detail="Failed to upsert budget")
        return _budget_out(refreshed)
    return _budget_out(data)


def list_scheduled_payments(user_id: str) -> list[dict[str, Any]]:
    rows = (
        get_supabase()
        .table("scheduled_payments")
        .select("*")
        .eq("user_id", user_id)
        .order("next_due_date")
        .execute()
        .data
        or []
    )
    return [_scheduled_out(r) for r in rows]


def create_scheduled_payment(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    row = {
        "user_id": user_id,
        "name": payload["name"],
        "amount_paise": payload["amountPaise"],
        "frequency": payload["frequency"],
        "next_due_date": payload["nextDueDate"],
        "is_active": payload.get("isActive", True),
    }
    result = get_supabase().table("scheduled_payments").insert(row).execute()
    data = (result.data or [None])[0]
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create scheduled payment")
    return _scheduled_out(data)


def patch_scheduled_payment(user_id: str, payment_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    sb = get_supabase()
    existing = (
        sb.table("scheduled_payments")
        .select("id")
        .eq("user_id", user_id)
        .eq("id", payment_id)
        .maybe_single()
        .execute()
        .data
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Scheduled payment not found")

    patch: dict[str, Any] = {}
    if payload.get("isActive") is not None:
        patch["is_active"] = payload["isActive"]
    if payload.get("nextDueDate") is not None:
        patch["next_due_date"] = payload["nextDueDate"]
    if not patch:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = sb.table("scheduled_payments").update(patch).eq("id", payment_id).eq("user_id", user_id).execute()
    data = (result.data or [None])[0]
    if not data:
        refreshed = (
            sb.table("scheduled_payments")
            .select("*")
            .eq("user_id", user_id)
            .eq("id", payment_id)
            .maybe_single()
            .execute()
            .data
        )
        if not refreshed:
            raise HTTPException(status_code=500, detail="Failed to update scheduled payment")
        return _scheduled_out(refreshed)
    return _scheduled_out(data)


def list_investments(user_id: str) -> list[dict[str, Any]]:
    rows = get_supabase().table("investments").select("*").eq("user_id", user_id).execute().data or []
    return [_investment_out(r) for r in rows]
