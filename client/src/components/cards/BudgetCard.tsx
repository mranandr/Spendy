import React, { useEffect } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../primitives';
import { formatINR } from '../../utils/currency';
import { getDaysRemaining } from '../../utils/date';

export interface BudgetCardProps {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetLimitPaise: number; // paise
  spentAmountPaise: number; // paise
  targetDate: Date | string | number;
  style?: StyleProp<ViewStyle>;
}

export const BudgetCard: React.FC<BudgetCardProps> = React.memo(({
  categoryName,
  categoryIcon,
  categoryColor,
  budgetLimitPaise,
  spentAmountPaise,
  targetDate,
  style,
}) => {
  const theme = useTheme();

  const ratio = budgetLimitPaise > 0 ? spentAmountPaise / budgetLimitPaise : 0;
  const percentage = Math.round(ratio * 100);
  const cappedRatio = Math.min(ratio, 1);

  // Reanimated progress value
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(cappedRatio, { duration: 800 });
  }, [cappedRatio]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  // Determine budget status color based on percentage
  let statusColor = theme.colors.income; // Emerald for safe
  if (percentage >= 90) {
    statusColor = theme.colors.expense; // Rose for warning/danger
  } else if (percentage >= 70) {
    statusColor = theme.colors.warning; // Amber for caution
  }

  const daysLeft = getDaysRemaining(targetDate);

  return (
    <View 
      variant="card" 
      padding="md" 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.colors.card, 
          borderColor: theme.colors.border 
        }, 
        style
      ]}
    >
      {/* Header Info */}
      <View row center={false} style={styles.header}>
        <View row center style={styles.categoryRow}>
          <View center style={[styles.iconCircle, { backgroundColor: categoryColor + '15' }]}>
            <Icon name={categoryIcon} size="sm" color={categoryColor} />
          </View>
          <Text variant="bodySmall" style={{ fontWeight: '700' }}>
            {categoryName}
          </Text>
        </View>
        
        {/* Days Left badge */}
        <View style={[styles.daysBadge, { backgroundColor: theme.colors.surface }]}>
          <Text variant="label" color="secondary" style={{ fontWeight: '600' }}>
            {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
          </Text>
        </View>
      </View>

      {/* Progress Bar Container */}
      <View style={styles.progressSection}>
        <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surface }]}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { backgroundColor: statusColor },
              progressStyle
            ]} 
          />
        </View>
      </View>

      {/* Footer Numbers */}
      <View row center={false} style={styles.footerRow}>
        <View>
          <Text variant="label" color="secondary" style={styles.numberLabel}>
            Spent
          </Text>
          <Text variant="bodySmall" style={{ fontWeight: '700', color: statusColor }}>
            {formatINR(spentAmountPaise)}
          </Text>
        </View>

        <View style={styles.percentageAlign}>
          <Text variant="bodySmall" style={{ fontWeight: '800', color: statusColor }}>
            {percentage}%
          </Text>
        </View>

        <View style={styles.limitAlign}>
          <Text variant="label" color="secondary" style={styles.numberLabel}>
            Limit
          </Text>
          <Text variant="bodySmall" color="primary" style={{ fontWeight: '700' }}>
            {formatINR(budgetLimitPaise)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  progressSection: {
    width: '100%',
    marginBottom: 12,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 9,
    marginBottom: 2,
  },
  percentageAlign: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitAlign: {
    alignItems: 'flex-end',
  },
});

export default BudgetCard;
