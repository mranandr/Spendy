import { PREDEFINED_CATEGORIES } from '../components/inputs/CategoryPicker';
import type { Account, Transaction } from '../store/financeStore';

export interface FilterState {
  types: string[];
  categoryIds: string[];
  accountIds: string[];
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export const EMPTY_FILTER_STATE: FilterState = {
  types: [],
  categoryIds: [],
  accountIds: [],
  dateRange: 'all',
};

export const FILTER_CATEGORY_OPTIONS = PREDEFINED_CATEGORIES.map((c) => ({
  label: c.name,
  value: c.id,
}));

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.types.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.accountIds.length > 0 ||
    filters.dateRange !== 'all'
  );
}

function categoryIdMatchesTransaction(categoryId: string, tx: Transaction): boolean {
  const cat = PREDEFINED_CATEGORIES.find((c) => c.id === categoryId);
  if (cat) return tx.categoryName === cat.name;
  return tx.categoryName === categoryId;
}

function matchesDateRange(dateIso: string, range: FilterState['dateRange']): boolean {
  if (range === 'all') return true;

  const txDate = new Date(dateIso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());

  if (range === 'today') {
    return txDay.getTime() === startOfToday.getTime();
  }

  if (range === 'week') {
    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return txDay >= weekStart && txDay < weekEnd;
  }

  if (range === 'month') {
    return (
      txDate.getMonth() === now.getMonth() &&
      txDate.getFullYear() === now.getFullYear()
    );
  }

  return true;
}

function matchesAccounts(
  tx: Transaction,
  accountIds: string[],
  accounts: Account[]
): boolean {
  if (accountIds.length === 0) return true;

  const selectedNames = new Set(
    accountIds
      .map((id) => accounts.find((a) => a.id === id)?.name)
      .filter((name): name is string => Boolean(name))
  );

  if (selectedNames.has(tx.accountName)) return true;
  if (tx.toAccountName && selectedNames.has(tx.toAccountName)) return true;
  return false;
}

export function filterTransactions(
  transactions: Transaction[],
  filters: FilterState,
  accounts: Account[],
  searchQuery = ''
): Transaction[] {
  const q = searchQuery.trim().toLowerCase();

  return transactions.filter((tx) => {
    if (q) {
      const haystack = `${tx.title} ${tx.categoryName} ${tx.accountName} ${tx.toAccountName ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.types.length > 0 && !filters.types.includes(tx.type)) {
      return false;
    }

    if (
      filters.categoryIds.length > 0 &&
      !filters.categoryIds.some((id) => categoryIdMatchesTransaction(id, tx))
    ) {
      return false;
    }

    if (!matchesAccounts(tx, filters.accountIds, accounts)) {
      return false;
    }

    if (!matchesDateRange(tx.date, filters.dateRange)) {
      return false;
    }

    return true;
  });
}
