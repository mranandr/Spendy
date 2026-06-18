import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Animated as RNAnimated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon, Gradient } from '../primitives';
import { formatINR } from '../../utils/currency';

export interface AccountCardProps {
  id: string;
  name: string;
  type: 'savings' | 'credit' | 'investment' | 'wallet';
  bankName: string;
  balancePaise: number;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AccountCard = React.memo<AccountCardProps>(function AccountCard({
  id,
  name,
  type,
  bankName,
  balancePaise,
  onEdit,
  onDelete,
  style,
}) {
  const theme = useTheme();
  const [balanceHidden, setBalanceHidden] = useState(false);

  // Determine gradients & icons based on account types
  let gradientPreset: 'primary' | 'income' | 'expense' | 'card' = 'card';
  let typeIcon = 'wallet';
  let typeLabel = 'Wallet';

  switch (type) {
    case 'savings':
      gradientPreset = 'primary';
      typeIcon = 'landmark';
      typeLabel = 'Savings Account';
      break;
    case 'credit':
      gradientPreset = 'expense';
      typeIcon = 'credit-card';
      typeLabel = 'Credit Card';
      break;
    case 'investment':
      gradientPreset = 'income';
      typeIcon = 'trending-up';
      typeLabel = 'Investment Account';
      break;
    case 'wallet':
      gradientPreset = 'card';
      typeIcon = 'wallet';
      typeLabel = 'Digital Wallet';
      break;
  }

  // Swipeable right actions
  const renderRightActions = (
    progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View row style={styles.actionsContainer}>
        {onEdit && (
          <TouchableOpacity 
            onPress={onEdit}
            style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
          >
            <RNAnimated.View style={{ transform: [{ scale }] }}>
              <Icon name="edit-2" size="sm" color="inverse" />
            </RNAnimated.View>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity 
            onPress={onDelete}
            style={[styles.actionButton, { backgroundColor: theme.colors.expense }]}
          >
            <RNAnimated.View style={{ transform: [{ scale }] }}>
              <Icon name="trash-2" size="sm" color="inverse" />
            </RNAnimated.View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={onEdit || onDelete ? renderRightActions : undefined}
      friction={2}
      rightThreshold={40}
    >
      <Gradient preset={gradientPreset} style={[styles.card, style]}>
        <View style={styles.cardHeader}>
          <View>
            <Text variant="h3" color="inverse" style={styles.accountName}>
              {name}
            </Text>
            <Text variant="caption" color="inverse" style={styles.bankName}>
              {bankName} • {typeLabel}
            </Text>
          </View>
          <View center style={styles.iconBackground}>
            <Icon name={typeIcon} size="md" color={gradientPreset === 'card' ? 'accent' : 'primary'} />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text variant="caption" color="inverse" style={styles.balanceLabel}>
              Available Balance
            </Text>
            <View row center={false} style={styles.balanceRow}>
              <Text variant="h1" color="inverse" style={styles.balanceValue}>
                {balanceHidden ? '••••••' : formatINR(balancePaise)}
              </Text>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setBalanceHidden(!balanceHidden)}
                style={styles.eyeButton}
              >
                <Icon 
                  name={balanceHidden ? 'eye-off' : 'eye'} 
                  size="sm" 
                  color="inverse" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Gradient>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  card: {
    height: 170,
    borderRadius: 18,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountName: {
    fontWeight: '700',
    opacity: 0.95,
  },
  bankName: {
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 2,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  cardFooter: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontWeight: '600',
    opacity: 0.75,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  balanceValue: {
    fontWeight: '800',
    fontSize: 28,
  },
  eyeButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    width: 130,
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginLeft: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
});

export default AccountCard;
