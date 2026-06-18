import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  createAccount as apiCreateAccount,
  createTransaction as apiCreateTransaction,
  patchScheduledPayment as apiPatchScheduledPayment,
  removeAccount as apiRemoveAccount,
  removeTransaction as apiRemoveTransaction,
  syncFinance,
  upsertBudget as apiUpsertBudget,
} from '../services/api/finance';

const customSecureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(name);
    }
    if (Platform.OS === 'web') return null;
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(name, value);
      return;
    }
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (e) {
      console.warn('SecureStore write failed', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(name);
      return;
    }
    if (Platform.OS === 'web') return;
    await SecureStore.deleteItemAsync(name);
  },
};

export interface Account {
  id: string;
  name: string;
  type: 'savings' | 'credit' | 'investment' | 'wallet';
  bankName: string;
  balancePaise: number;
}

export interface Transaction {
  id: string;
  title: string;
  amountPaise: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  categoryIcon: string;
  categoryColor: string;
  categoryName: string;
  accountName: string;
  toAccountName?: string;
  note?: string;
}

export interface Budget {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetLimitPaise: number;
  spentAmountPaise: number;
  targetDate: string;
}

export interface Investment {
  id: string;
  provider: 'zerodha' | 'groww' | 'indmoney' | 'other';
  holdingName: string;
  currentValuePaise: number;
  investedValuePaise: number;
}

export interface ScheduledPayment {
  id: string;
  name: string;
  amountPaise: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  isActive: boolean;
}

export interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  investments: Investment[];
  scheduledPayments: ScheduledPayment[];
  isSyncing: boolean;
  syncError: string | null;

  loadFromServer: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (acc: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  toggleScheduledPayment: (id: string, state: boolean) => void;
  updateBudget: (categoryName: string, budgetLimitPaise: number) => void;
  setInvestments: (investments: Investment[]) => void;
  mergeInvestmentsByProvider: (
    provider: Investment['provider'],
    rows: Investment[]
  ) => void;
  resetAllData: () => void;
}

const EMPTY = {
  accounts: [] as Account[],
  transactions: [] as Transaction[],
  budgets: [] as Budget[],
  investments: [] as Investment[],
  scheduledPayments: [] as ScheduledPayment[],
};

async function applyServerSnapshot(set: (partial: Partial<FinanceState>) => void) {
  const data = await syncFinance();
  set({
    accounts: data.accounts,
    transactions: data.transactions,
    budgets: data.budgets,
    investments: data.investments,
    scheduledPayments: data.scheduledPayments,
    syncError: null,
  });
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      isSyncing: false,
      syncError: null,

      loadFromServer: async () => {
        set({ isSyncing: true, syncError: null });
        try {
          await applyServerSnapshot(set);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to load finance data';
          set({ syncError: msg });
        } finally {
          set({ isSyncing: false });
        }
      },

      addTransaction: (tx) => {
        void (async () => {
          try {
            await apiCreateTransaction(tx);
            await applyServerSnapshot(set);
          } catch (err: unknown) {
            set({ syncError: err instanceof Error ? err.message : 'Failed to save transaction' });
          }
        })();
      },

      deleteTransaction: (id) => {
        void (async () => {
          try {
            await apiRemoveTransaction(id);
            await applyServerSnapshot(set);
          } catch (err: unknown) {
            set({ syncError: err instanceof Error ? err.message : 'Failed to delete transaction' });
          }
        })();
      },

      addAccount: (acc) => {
        void (async () => {
          try {
            await apiCreateAccount(acc);
            await applyServerSnapshot(set);
          } catch (err: unknown) {
            set({ syncError: err instanceof Error ? err.message : 'Failed to save account' });
          }
        })();
      },

      deleteAccount: (id) => {
        void (async () => {
          try {
            await apiRemoveAccount(id);
            await applyServerSnapshot(set);
          } catch (err: unknown) {
            set({ syncError: err instanceof Error ? err.message : 'Failed to delete account' });
          }
        })();
      },

      toggleScheduledPayment: (id, isActive) => {
        void (async () => {
          try {
            await apiPatchScheduledPayment(id, { isActive });
            await applyServerSnapshot(set);
          } catch (err: unknown) {
            set({ syncError: err instanceof Error ? err.message : 'Failed to update payment' });
          }
        })();
      },

      updateBudget: (categoryName, budgetLimitPaise) => {
        void (async () => {
          const existing = get().budgets.find((b) => b.categoryName === categoryName);
          const budget: Budget = existing
            ? { ...existing, budgetLimitPaise }
            : {
                categoryName,
                categoryIcon: 'file-text',
                categoryColor: '#6C63FF',
                budgetLimitPaise,
                spentAmountPaise: 0,
                targetDate: new Date(Date.now() + 86400000 * 30).toISOString(),
              };
          try {
            await apiUpsertBudget(budget);
            await applyServerSnapshot(set);
          } catch (err: unknown) {
            set({ syncError: err instanceof Error ? err.message : 'Failed to save budget' });
          }
        })();
      },

      setInvestments: (investments) => set({ investments }),

      mergeInvestmentsByProvider: (provider, rows) =>
        set((state) => {
          const others = state.investments.filter((i) => i.provider !== provider);
          return { investments: [...others, ...rows] };
        }),

      resetAllData: () =>
        set({
          ...EMPTY,
          isSyncing: false,
          syncError: null,
        }),
    }),
    {
      name: 'expenseiq-finance-store',
      storage: createJSONStorage(() => customSecureStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        budgets: state.budgets,
        investments: state.investments,
        scheduledPayments: state.scheduledPayments,
      }),
    }
  )
);
