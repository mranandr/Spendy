import React, { useState, forwardRef, useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { 
  BottomSheetModal, 
  BottomSheetView,
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/tokens';
import { View, Text, Pressable, Icon } from '../primitives';
import { TextInput, AmountInput, DatePicker, CategoryPicker, Dropdown, Category } from '../inputs';

export interface AddTransactionSheetProps {
  accounts: { label: string; value: string }[];
  initialType?: 'income' | 'expense' | 'transfer';
  onSave: (transaction: {
    title: string;
    amountPaise: number;
    type: 'income' | 'expense' | 'transfer';
    categoryId?: string;
    accountId: string;
    toAccountId?: string;
    date: Date;
  }) => void;
}

export const AddTransactionSheet = forwardRef<BottomSheetModal, AddTransactionSheetProps>(({
  accounts,
  initialType = 'expense',
  onSave,
}, ref) => {
  const theme = useTheme();

  // Local Form State
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(initialType);
  const [amountPaise, setAmountPaise] = useState(0);
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [accountId, setAccountId] = useState<string[]>([]);
  const [toAccountId, setToAccountId] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const snapPoints = useMemo(() => ['85%', '92%'], []);

  React.useEffect(() => {
    setType(initialType);
  }, [initialType]);

  const destinationAccounts = useMemo(() => {
    const fromId = accountId[0];
    if (!fromId) return accounts;
    return accounts.filter((a) => a.value !== fromId);
  }, [accounts, accountId]);

  const handleTypeChange = (newType: 'income' | 'expense' | 'transfer') => {
    setType(newType);
    if (newType === 'transfer') {
      setSelectedCategory(null);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.category;
        return next;
      });
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (amountPaise <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!title.trim()) {
      newErrors.title = 'Please enter a description';
    }
    if (type !== 'transfer' && !selectedCategory) {
      newErrors.category = 'Please select a category';
    }
    if (accountId.length === 0) {
      newErrors.account = type === 'transfer' ? 'Please select a source account' : 'Please select an account';
    }
    if (type === 'transfer') {
      if (toAccountId.length === 0) {
        newErrors.toAccount = 'Please select a destination account';
      } else if (toAccountId[0] === accountId[0]) {
        newErrors.toAccount = 'Destination must differ from source';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      title: title.trim(),
      amountPaise,
      type,
      categoryId: selectedCategory?.id,
      accountId: accountId[0],
      toAccountId: type === 'transfer' ? toAccountId[0] : undefined,
      date,
    });

    setTitle('');
    setAmountPaise(0);
    setSelectedCategory(null);
    setAccountId([]);
    setToAccountId([]);
    setDate(new Date());
    setErrors({});
    
    // Close Sheet
    (ref as any)?.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Title */}
        <Text variant="h2" style={styles.sheetTitle}>
          Add Transaction
        </Text>

        {/* Transaction Type Tabs */}
        <View row style={[styles.tabsContainer, { backgroundColor: theme.colors.card }]}>
          {(['expense', 'income', 'transfer'] as const).map((t) => {
            const isSelected = type === t;
            let activeColor = theme.colors.accent;
            if (t === 'income') activeColor = theme.colors.income;
            else if (t === 'expense') activeColor = theme.colors.expense;

            return (
              <TouchableOpacity
                key={t}
                onPress={() => handleTypeChange(t)}
                style={[
                  styles.tabButton,
                  isSelected && { backgroundColor: theme.colors.surface, borderColor: activeColor, borderWidth: 1 }
                ]}
              >
                <Text 
                  variant="caption" 
                  style={{ 
                    fontWeight: '700',
                    color: isSelected ? activeColor : theme.colors.text.secondary,
                    textTransform: 'uppercase'
                  }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Big Amount Input */}
        <View style={styles.amountContainer}>
          <AmountInput 
            valuePaise={amountPaise} 
            onChangePaise={(val) => {
              setAmountPaise(val);
              if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
            }} 
            color={type === 'expense' ? 'expense' : type === 'income' ? 'income' : 'accent'}
          />
          {errors.amount && (
            <Text variant="caption" color="expense" align="center" style={styles.errorText}>
              {errors.amount}
            </Text>
          )}
        </View>

        {/* TextInput description */}
        <TextInput
          label={type === 'transfer' ? 'Transfer note' : 'What was this for?'}
          placeholder={type === 'transfer' ? 'E.g. Move to savings' : 'E.g. Starbucks Coffee, Uber Ride'}
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
          }}
          error={errors.title}
          leftIcon="file-text"
        />

        {type !== 'transfer' && (
          <>
            <CategoryPicker
              selectedCategoryId={selectedCategory?.id || ''}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
              }}
            />
            {errors.category && (
              <Text variant="caption" color="expense" style={styles.inlineErrorText}>
                {errors.category}
              </Text>
            )}
          </>
        )}

        <Dropdown
          label={type === 'transfer' ? 'From Account' : 'Payment Account'}
          options={accounts}
          selectedValues={accountId}
          onSelect={(vals) => {
            setAccountId(vals);
            if (vals[0] && toAccountId[0] === vals[0]) {
              setToAccountId([]);
            }
            if (errors.account) setErrors(prev => ({ ...prev, account: '' }));
          }}
          error={errors.account}
          placeholder="Choose Bank or Wallet..."
        />

        {type === 'transfer' && (
          <Dropdown
            label="To Account"
            options={destinationAccounts}
            selectedValues={toAccountId}
            onSelect={(vals) => {
              setToAccountId(vals);
              if (errors.toAccount) setErrors(prev => ({ ...prev, toAccount: '' }));
            }}
            error={errors.toAccount}
            placeholder="Choose destination..."
          />
        )}

        {/* Date Picker */}
        <DatePicker
          label="Transaction Date"
          date={date}
          onDateChange={setDate}
        />

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: theme.colors.accent }]}
        >
          <Text variant="body" color="inverse" style={{ fontWeight: '700' }}>
            {type === 'transfer' ? 'Save Transfer' : 'Save Transaction'}
          </Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountContainer: {
    marginBottom: 16,
  },
  saveButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  errorText: {
    marginTop: 4,
    fontWeight: '600',
  },
  inlineErrorText: {
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default AddTransactionSheet;
