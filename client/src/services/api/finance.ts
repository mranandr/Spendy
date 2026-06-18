import { api } from './http';
import type {
  Account,
  Budget,
  Investment,
  ScheduledPayment,
  Transaction,
} from '../../store/financeStore';

export interface FinanceSyncPayload {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  scheduledPayments: ScheduledPayment[];
  investments: Investment[];
}

export async function syncFinance(): Promise<FinanceSyncPayload> {
  const { data } = await api.get<FinanceSyncPayload>('/finance/sync');
  return data;
}

export async function fetchAccounts(): Promise<Account[]> {
  const { data } = await api.get<Account[]>('/finance/accounts');
  return data;
}

export async function createAccount(account: Omit<Account, 'id'>): Promise<Account> {
  const { data } = await api.post<Account>('/finance/accounts', account);
  return data;
}

export async function removeAccount(accountId: string): Promise<void> {
  await api.delete(`/finance/accounts/${accountId}`);
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/finance/transactions');
  return data;
}

export async function createTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
  const { data } = await api.post<Transaction>('/finance/transactions', tx);
  return data;
}

export async function removeTransaction(transactionId: string): Promise<void> {
  await api.delete(`/finance/transactions/${transactionId}`);
}

export async function fetchBudgets(): Promise<Budget[]> {
  const { data } = await api.get<Budget[]>('/finance/budgets');
  return data;
}

export async function upsertBudget(budget: Budget): Promise<Budget> {
  const { data } = await api.put<Budget>('/finance/budgets', budget);
  return data;
}

export async function fetchScheduledPayments(): Promise<ScheduledPayment[]> {
  const { data } = await api.get<ScheduledPayment[]>('/finance/scheduled-payments');
  return data;
}

export async function createScheduledPayment(
  payment: Omit<ScheduledPayment, 'id'>
): Promise<ScheduledPayment> {
  const { data } = await api.post<ScheduledPayment>('/finance/scheduled-payments', payment);
  return data;
}

export async function patchScheduledPayment(
  paymentId: string,
  patch: Partial<Pick<ScheduledPayment, 'isActive' | 'nextDueDate'>>
): Promise<ScheduledPayment> {
  const { data } = await api.patch<ScheduledPayment>(`/finance/scheduled-payments/${paymentId}`, patch);
  return data;
}

export async function fetchInvestments(): Promise<Investment[]> {
  const { data } = await api.get<Investment[]>('/finance/investments');
  return data;
}
