import { PREDEFINED_CATEGORIES } from '../components/inputs/CategoryPicker';
import type { Account, Transaction } from '../store/financeStore';

const TRANSFER_CATEGORY = {
  icon: 'arrow-right-left',
  color: '#6C63FF',
  name: 'Transfer',
};

export interface AddTransactionForm {
  title: string;
  amountPaise: number;
  type: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  accountId: string;
  toAccountId?: string;
  date: Date;
}

export function buildTransactionPayload(
  form: AddTransactionForm,
  accounts: Account[]
): Omit<Transaction, 'id'> {
  const sourceAcc = accounts.find((a) => a.id === form.accountId);
  if (!sourceAcc) {
    throw new Error('Please select a valid account');
  }

  let categoryIcon = 'file-text';
  let categoryColor = '#6C63FF';
  let categoryName = 'General';

  if (form.type === 'transfer') {
    categoryIcon = TRANSFER_CATEGORY.icon;
    categoryColor = TRANSFER_CATEGORY.color;
    categoryName = TRANSFER_CATEGORY.name;
  } else if (form.categoryId) {
    const cat = PREDEFINED_CATEGORIES.find((c) => c.id === form.categoryId);
    if (cat) {
      categoryIcon = cat.icon;
      categoryColor = cat.color;
      categoryName = cat.name;
    }
  }

  let toAccountName: string | undefined;
  if (form.type === 'transfer') {
    if (!form.toAccountId) {
      throw new Error('Please select a destination account');
    }
    const dest = accounts.find((a) => a.id === form.toAccountId);
    if (!dest) {
      throw new Error('Please select a valid destination account');
    }
    if (dest.id === sourceAcc.id) {
      throw new Error('Source and destination accounts must be different');
    }
    toAccountName = dest.name;
  }

  return {
    title: form.title,
    amountPaise: form.amountPaise,
    type: form.type,
    date: form.date.toISOString(),
    categoryIcon,
    categoryColor,
    categoryName,
    accountName: sourceAcc.name,
    ...(toAccountName ? { toAccountName } : {}),
  };
}
