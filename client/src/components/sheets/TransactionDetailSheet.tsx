import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { 
  BottomSheetModal, 
  BottomSheetScrollView 
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon, Pressable } from '../primitives';
import { formatINR } from '../../utils/currency';
import { formatDate, formatTime } from '../../utils/date';

export interface TransactionDetailSheetProps {
  transaction: {
    id: string;
    title: string;
    amountPaise: number;
    type: 'income' | 'expense' | 'transfer';
    date: Date | string | number;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    accountName: string;
    note?: string;
  } | null;
  onEdit: (transactionId: string) => void;
  onDelete: (transactionId: string) => void;
}

export const TransactionDetailSheet = forwardRef<BottomSheetModal, TransactionDetailSheetProps>(({
  transaction,
  onEdit,
  onDelete,
}, ref) => {
  const theme = useTheme();

  const snapPoints = useMemo(() => ['75%', '85%'], []);

  if (!transaction) return null;

  const handleShare = async () => {
    try {
      const shareMsg = `ExpenseIQ Receipt:\n\n` +
        `Merchant: ${transaction.title}\n` +
        `Amount: ${formatINR(transaction.amountPaise)}\n` +
        `Category: ${transaction.categoryName}\n` +
        `Account: ${transaction.accountName}\n` +
        `Date: ${formatDate(transaction.date)}\n` +
        `Tracked beautifully on ExpenseIQ!`;

      await Share.share({
        message: shareMsg,
      });
    } catch (error: any) {
      Alert.alert('Error sharing receipt', error.message);
    }
  };

  const handleEdit = () => {
    onEdit(transaction.id);
    (ref as any)?.current?.dismiss();
  };

  const handleDelete = () => {
    onDelete(transaction.id);
    (ref as any)?.current?.dismiss();
  };

  let typeColor = theme.colors.accent;
  let typeLabel = 'Transfer';
  if (transaction.type === 'income') {
    typeColor = theme.colors.income;
    typeLabel = 'Income';
  } else if (transaction.type === 'expense') {
    typeColor = theme.colors.expense;
    typeLabel = 'Expense';
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Receipt Header Circle */}
        <View center style={styles.header}>
          <View center style={[styles.categoryCircle, { backgroundColor: transaction.categoryColor + '20' }]}>
            <Icon name={transaction.categoryIcon} size="lg" color={transaction.categoryColor} />
          </View>
          <Text variant="h2" style={{ fontWeight: '800', marginTop: 12 }}>
            {transaction.title}
          </Text>
          <Text variant="display" style={[styles.amountText, { color: typeColor }]}>
            {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
            {formatINR(transaction.amountPaise)}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '15' }]}>
            <Text variant="label" style={{ fontWeight: '700', color: typeColor }}>
              {typeLabel}
            </Text>
          </View>
        </View>

        {/* Receipt Table Container */}
        <View style={[styles.receiptCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View row center={false} style={styles.receiptRow}>
            <Text variant="caption" color="secondary">Category</Text>
            <Text variant="bodySmall" style={{ fontWeight: '700' }}>{transaction.categoryName}</Text>
          </View>

          <View style={[styles.dashedLine, { borderColor: theme.colors.border + '50' }]} />

          <View row center={false} style={styles.receiptRow}>
            <Text variant="caption" color="secondary">Paid Via</Text>
            <Text variant="bodySmall" style={{ fontWeight: '700' }}>{transaction.accountName}</Text>
          </View>

          <View style={[styles.dashedLine, { borderColor: theme.colors.border + '50' }]} />

          <View row center={false} style={styles.receiptRow}>
            <Text variant="caption" color="secondary">Date</Text>
            <Text variant="bodySmall" style={{ fontWeight: '700' }}>{formatDate(transaction.date)}</Text>
          </View>

          <View style={[styles.dashedLine, { borderColor: theme.colors.border + '50' }]} />

          <View row center={false} style={styles.receiptRow}>
            <Text variant="caption" color="secondary">Time</Text>
            <Text variant="bodySmall" style={{ fontWeight: '700' }}>{formatTime(transaction.date)}</Text>
          </View>

          {transaction.note && (
            <>
              <View style={[styles.dashedLine, { borderColor: theme.colors.border + '50' }]} />
              <View row center={false} style={styles.receiptRow}>
                <Text variant="caption" color="secondary">Notes</Text>
                <Text variant="bodySmall" style={{ fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>
                  {transaction.note}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Action Options */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            onPress={handleShare}
            style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
          >
            <Icon name="share-2" size="sm" color="inverse" style={styles.actionIcon} />
            <Text variant="body" color="inverse" style={{ fontWeight: '700' }}>
              Share Receipt
            </Text>
          </TouchableOpacity>

          <View row style={styles.bottomRow}>
            <TouchableOpacity 
              onPress={handleEdit}
              style={[styles.halfButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <Icon name="edit-2" size="sm" color="primary" style={styles.actionIcon} />
              <Text variant="bodySmall" style={{ fontWeight: '700' }}>
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleDelete}
              style={[styles.halfButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.expense + '40' }]}
            >
              <Icon name="trash-2" size="sm" color="expense" style={styles.actionIcon} />
              <Text variant="bodySmall" color="expense" style={{ fontWeight: '700' }}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
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
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  amountText: {
    fontSize: 34,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  receiptCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dashedLine: {
    borderWidth: 0.5,
    borderStyle: 'dashed',
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  actionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 6,
  },
});

export default TransactionDetailSheet;
