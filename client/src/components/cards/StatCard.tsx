import React from 'react';
import { StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../primitives';

export interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconColor?: string;
  delta?: number; // e.g. +12.4 or -4.5
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  label,
  value,
  icon,
  iconColor,
  delta,
  onPress,
  style,
}) => {
  const theme = useTheme();

  const finalIconColor = iconColor || theme.colors.accent;

  const isPositive = delta !== undefined && delta >= 0;
  const deltaColor = isPositive ? 'income' : 'expense';
  const deltaIconName = isPositive ? 'trending-up' : 'trending-down';

  const cardContent = (
    <View 
      variant="card" 
      padding="md" 
      style={[
        styles.cardBody, 
        { 
          backgroundColor: theme.colors.card, 
          borderColor: theme.colors.border 
        }
      ]}
    >
      <View row center={false} style={styles.header}>
        {/* Rounded Icon Container */}
        <View 
          center 
          style={[
            styles.iconCircle, 
            { backgroundColor: finalIconColor + '15' }
          ]}
        >
          <Icon name={icon} size="sm" color={finalIconColor} />
        </View>
        
        {/* Delta Chip */}
        {delta !== undefined && (
          <View 
            row 
            center 
            style={[
              styles.deltaChip, 
              { backgroundColor: (isPositive ? theme.colors.income : theme.colors.expense) + '15' }
            ]}
          >
            <Icon name={deltaIconName} size="sm" color={deltaColor} style={styles.deltaIcon} />
            <Text variant="label" color={deltaColor} style={{ fontWeight: '700', fontSize: 9 }}>
              {isPositive ? '+' : ''}{delta}%
            </Text>
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.content}>
        <Text variant="caption" color="secondary" style={styles.label}>
          {label}
        </Text>
        <Text variant="h2" style={{ fontWeight: '800', marginTop: 4 }}>
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        activeOpacity={0.85} 
        onPress={onPress} 
        style={[styles.container, style]}
      >
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
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  cardBody: {
    height: 120,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  deltaChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deltaIcon: {
    marginRight: 2,
  },
  content: {
    alignItems: 'flex-start',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    fontSize: 9,
  },
});

export default StatCard;
