import React from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Animated as RNAnimated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../primitives';
import { formatINR, getSign } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export interface TransactionCardProps {
  id: string;
  title: string; // Merchant / Name
  date: Date | string | number;
  amountPaise: number; // paise
  type: 'income' | 'expense' | 'transfer';
  categoryIcon: string;
  categoryColor: string;
  accountName: string;
  toAccountName?: string;
  onDelete?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const TransactionCard: React.FC<TransactionCardProps> = React.memo(({
  id,
  title,
  date,
  amountPaise,
  type,
  categoryIcon,
  categoryColor,
  accountName,
  toAccountName,
  onDelete,
  onPress,
  style,
}) => {
  const theme = useTheme();

  // Determine amount styling
  let amountColor = 'primary';
  if (type === 'income') amountColor = 'income';
  else if (type === 'expense') amountColor = 'expense';
  else if (type === 'transfer') amountColor = 'accent';

  const sign = getSign(type);
  const formattedAmount = `${sign}${formatINR(amountPaise)}`;

  // Right swipe-to-delete action
  const renderRightActions = (
    progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          onPress={onDelete}
          style={[styles.deleteButton, { backgroundColor: theme.colors.expense }]}
        >
          <RNAnimated.View style={{ transform: [{ scale }] }}>
            <Icon name="trash-2" size="sm" color="inverse" />
          </RNAnimated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const CardContent = (
    <View 
      row 
      center={false} 
      style={[
        styles.cardBody, 
        { 
          backgroundColor: theme.colors.card, 
          borderColor: theme.colors.border 
        }
      ]}
    >
      {/* Colored Circle Category Icon */}
      <View 
        center 
        style={[
          styles.iconCircle, 
          { backgroundColor: categoryColor + '18' }
        ]}
      >
        <Icon name={categoryIcon} size="md" color={categoryColor} />
      </View>

      {/* Title & Info */}
      <View style={styles.textSection}>
        <Text variant="bodySmall" style={{ fontWeight: '700' }} numberOfLines={1}>
          {title}
        </Text>
        <View row center={false} style={styles.metaRow}>
          <Text variant="caption" color="secondary" style={styles.metaText}>
            {formatDate(date)}
          </Text>
          <View style={[styles.badge, { backgroundColor: theme.colors.surface }]}>
            <Text variant="label" color="secondary" style={{ fontWeight: '600', fontSize: 9 }}>
              {type === 'transfer' && toAccountName
                ? `${accountName} → ${toAccountName}`
                : accountName}
            </Text>
          </View>
        </View>
      </View>

      {/* Amount Display */}
      <View style={styles.amountSection}>
        <Text 
          variant="body" 
          color={amountColor}
          style={{ fontWeight: '700', textAlign: 'right' }}
        >
          {formattedAmount}
        </Text>
      </View>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={onDelete ? renderRightActions : undefined}
      friction={2}
      rightThreshold={30}
    >
      {onPress ? (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.container, style]}>
          {CardContent}
        </TouchableOpacity>
      ) : (
        <View style={[styles.container, style]}>
          {CardContent}
        </View>
      )}
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  cardBody: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  amountSection: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  actionContainer: {
    width: 76,
    height: '100%',
    paddingLeft: 8,
  },
  deleteButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
});

export default TransactionCard;
