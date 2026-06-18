from fastapi import APIRouter, Depends, HTTPException

from app.auth import AuthUser, get_current_user
from app.models.finance_schemas import (
    AccountCreate,
    AccountOut,
    BudgetOut,
    BudgetUpsert,
    FinanceSyncResponse,
    InvestmentOut,
    ScheduledPaymentCreate,
    ScheduledPaymentOut,
    ScheduledPaymentPatch,
    TransactionCreate,
    TransactionOut,
)
from app.services import finance as finance_service

router = APIRouter(prefix="/finance", tags=["finance"])


@router.get("/sync", response_model=FinanceSyncResponse)
async def sync_finance(user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.sync_user_finance(user.user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/accounts", response_model=list[AccountOut])
async def get_accounts(user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.list_accounts(user.user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/accounts", response_model=AccountOut, status_code=201)
async def post_account(body: AccountCreate, user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.create_account(user.user_id, body.model_dump(by_alias=True))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.delete("/accounts/{account_id}", status_code=204)
async def remove_account(account_id: str, user: AuthUser = Depends(get_current_user)):
    try:
        finance_service.delete_account(user.user_id, account_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/transactions", response_model=list[TransactionOut])
async def get_transactions(user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.list_transactions(user.user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/transactions", response_model=TransactionOut, status_code=201)
async def post_transaction(body: TransactionCreate, user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.create_transaction(user.user_id, body.model_dump(by_alias=True))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.delete("/transactions/{transaction_id}", status_code=204)
async def remove_transaction(transaction_id: str, user: AuthUser = Depends(get_current_user)):
    try:
        finance_service.delete_transaction(user.user_id, transaction_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/budgets", response_model=list[BudgetOut])
async def get_budgets(user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.list_budgets(user.user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.put("/budgets", response_model=BudgetOut)
async def put_budget(body: BudgetUpsert, user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.upsert_budget(user.user_id, body.model_dump(by_alias=True))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/scheduled-payments", response_model=list[ScheduledPaymentOut])
async def get_scheduled_payments(user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.list_scheduled_payments(user.user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/scheduled-payments", response_model=ScheduledPaymentOut, status_code=201)
async def post_scheduled_payment(body: ScheduledPaymentCreate, user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.create_scheduled_payment(user.user_id, body.model_dump(by_alias=True))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.patch("/scheduled-payments/{payment_id}", response_model=ScheduledPaymentOut)
async def patch_scheduled_payment(
    payment_id: str,
    body: ScheduledPaymentPatch,
    user: AuthUser = Depends(get_current_user),
):
    try:
        return finance_service.patch_scheduled_payment(
            user.user_id, payment_id, body.model_dump(by_alias=True, exclude_none=True)
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/investments", response_model=list[InvestmentOut])
async def get_investments(user: AuthUser = Depends(get_current_user)):
    try:
        return finance_service.list_investments(user.user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
