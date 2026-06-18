import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { 
  BottomSheetModal, 
  BottomSheetView,
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon, Pressable } from '../primitives';
import { TransactionCard } from '../cards';
import { formatINR } from '../../utils/currency';

export interface AccountDetailSheetProps {
  account: {
    id: string;
    name: string;
    type: 'savings' | 'credit' | 'investment' | 'wallet';
    bankName: string;
    balancePaise: number;
  } | null;
  recentTransactions: Array<{
    id: string;
    title: string;
    date: Date | string | number;
    amountPaise: number;
    type: 'income' | 'expense' | 'transfer';
    categoryIcon: string;
    categoryColor: string;
  }>;
  onEdit: (accountId: string) => void;
  onDelete: (accountId: string) => void;
  onPressTransaction?: (transactionId: string) => void;
}

export const AccountDetailSheet = forwardRef<BottomSheetModal, AccountDetailSheetProps>(({
  account,
  recentTransactions,
  onEdit,
  onDelete,
  onPressTransaction,
}, ref) => {
  const theme = useTheme();

  const snapPoints = useMemo(() => ['80%', '90%'], []);

  if (!account) return null;

  const handleEdit = () => {
    onEdit(account.id);
    (ref as any)?.current?.dismiss();
  };

  const handleDelete = () => {
    onDelete(account.id);
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
        {/* Account Summary Banner */}
        <View 
          style={[
            styles.banner, 
            { 
              backgroundColor: theme.colors.card, 
              borderColor: theme.colors.border 
            }
          ]}
        >
          <Text variant="caption" color="secondary" style={styles.bannerLabel}>
            {account.bankName.toUpperCase()}
          </Text>
          <Text variant="h2" style={{ fontWeight: '800', marginTop: 4 }}>
            {account.name}
          </Text>
          <Text variant="display" color="accent" style={styles.balanceText}>
            {formatINR(account.balancePaise)}
          </Text>
          <Text variant="caption" color="secondary">
            Current Balance
          </Text>
        </View>

        {/* Action Buttons Row */}
        <View row style={styles.actionsRow}>
          <TouchableOpacity 
            onPress={handleEdit}
            style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Icon name="edit-2" size="sm" color="accent" style={styles.btnIcon} />
            <Text variant="bodySmall" style={{ fontWeight: '700' }}>
              Edit Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDelete}
            style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.expense + '40' }]}
          >
            <Icon name="trash-2" size="sm" color="expense" style={styles.btnIcon} />
            <Text variant="bodySmall" color="expense" style={{ fontWeight: '700' }}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions List */}
        <View style={styles.transactionsSection}>
          <Text variant="bodySmall" color="secondary" style={styles.sectionTitle}>
            Recent Transactions
          </Text>

          {recentTransactions.length === 0 ? (
            <View center padding="lg" style={styles.emptyContainer}>
              <Text variant="caption" color="secondary">
                No transactions associated with this account
              </Text>
            </View>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionCard
                key={tx.id}
                id={tx.id}
                title={tx.title}
                date={tx.date}
                amountPaise={tx.amountPaise}
                type={tx.type}
                categoryIcon={tx.categoryIcon}
                categoryColor={tx.categoryColor}
                accountName={account.name}
                onPress={onPressTransaction ? () => onPressTransaction(tx.id) : undefined}
              />
            ))
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  banner: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceText: {
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 6,
  },
  transactionsSection: {
    width: '100%',
  },
  sectionTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
    marginBottom: 10,
  },
  emptyContainer: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#49496040',
    borderRadius: 12,
    height: 100,
    justifyContent: 'center',
  },
});

export default AccountDetailSheet;
