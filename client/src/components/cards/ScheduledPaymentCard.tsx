import React from 'react';
import { StyleSheet, Switch, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../primitives';
import { formatINR } from '../../utils/currency';
import { formatDate, getDaysRemaining } from '../../utils/date';

export interface ScheduledPaymentCardProps {
  id: string;
  name: string;
  amountPaise: number; // paise
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: Date | string | number;
  isActive: boolean;
  onToggleActive: (isActive: boolean) => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ScheduledPaymentCard: React.FC<ScheduledPaymentCardProps> = React.memo(({
  id,
  name,
  amountPaise,
  frequency,
  nextDueDate,
  isActive,
  onToggleActive,
  onPress,
  style,
}) => {
  const theme = useTheme();

  const daysLeft = getDaysRemaining(nextDueDate);
  const isUrgent = daysLeft <= 3 && daysLeft >= 0;

  // Resolve frequency label
  const freqLabel = frequency.charAt(0).toUpperCase() + frequency.slice(1);

  const cardContent = (
    <View 
      variant="card" 
      padding="md" 
      style={[
        styles.cardBody, 
        { 
          backgroundColor: theme.colors.card, 
          borderColor: theme.colors.border,
          opacity: isActive ? 1 : 0.7 
        }
      ]}
    >
      <View row center={false} style={styles.topRow}>
        <View style={styles.leftSide}>
          <Text variant="bodySmall" style={{ fontWeight: '700' }} numberOfLines={1}>
            {name}
          </Text>
          <View row center={false} style={styles.badgeRow}>
            {/* Frequency Badge */}
            <View style={[styles.badge, { backgroundColor: theme.colors.surface }]}>
              <Text variant="label" color="secondary" style={{ fontWeight: '600' }}>
                {freqLabel}
              </Text>
            </View>
            
            {/* Status Chip */}
            <View 
              style={[
                styles.badge, 
                { backgroundColor: (isActive ? theme.colors.income : theme.colors.warning) + '15' }
              ]}
            >
              <Text 
                variant="label" 
                color={isActive ? 'income' : 'warning'} 
                style={{ fontWeight: '700', fontSize: 9 }}
              >
                {isActive ? 'Active' : 'Paused'}
              </Text>
            </View>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.rightSide}>
          <Text variant="body" color="primary" style={{ fontWeight: '800' }}>
            {formatINR(amountPaise)}
          </Text>
          {/* Switch toggle */}
          <Switch
            value={isActive}
            onValueChange={onToggleActive}
            trackColor={{ false: theme.colors.border, true: theme.colors.accent + '60' }}
            thumbColor={isActive ? theme.colors.accent : theme.colors.text.tertiary}
            style={styles.switch}
          />
        </View>
      </View>

      {/* Due Date Bottom Area */}
      <View style={[styles.separator, { backgroundColor: theme.colors.border + '40' }]} />

      <View row center={false} style={styles.bottomRow}>
        <View row center={false} style={styles.dueDateContainer}>
          <Icon 
            name="calendar" 
            size="sm" 
            color={isUrgent ? 'expense' : 'secondary'} 
            style={styles.calendarIcon} 
          />
          <Text 
            variant="caption" 
            color={isUrgent ? 'expense' : 'secondary'} 
            style={{ fontWeight: isUrgent ? '700' : '500' }}
          >
            Due {formatDate(nextDueDate)}
          </Text>
        </View>

        {isUrgent && (
          <Text variant="label" color="expense" style={styles.urgentText}>
            Due in {daysLeft === 0 ? 'today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}!
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.container, style]}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {cardContent}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  cardBody: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSide: {
    flex: 1,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 6,
  },
  urgentText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    fontSize: 9,
  },
});

export default ScheduledPaymentCard;
