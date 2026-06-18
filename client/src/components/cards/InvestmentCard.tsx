import React, { useEffect } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay
} from 'react-native-reanimated';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../primitives';
import { formatINR } from '../../utils/currency';

export interface InvestmentCardProps {
  id: string;
  provider: 'zerodha' | 'groww' | 'indmoney' | 'other';
  holdingName: string;
  currentValuePaise: number; // paise
  investedValuePaise: number; // paise
  style?: StyleProp<ViewStyle>;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = React.memo(({
  id,
  provider,
  holdingName,
  currentValuePaise,
  investedValuePaise,
  style,
}) => {
  const theme = useTheme();

  const pnlPaise = currentValuePaise - investedValuePaise;
  const isPositive = pnlPaise >= 0;
  const pnlPercent = investedValuePaise > 0 ? (pnlPaise / investedValuePaise) * 100 : 0;

  // Reanimated values for animations on mount
  const opacityVal = useSharedValue(0);
  const translateYVal = useSharedValue(12);
  const arrowScaleVal = useSharedValue(0);

  useEffect(() => {
    opacityVal.value = withTiming(1, { duration: 600 });
    translateYVal.value = withTiming(0, { duration: 600 });
    arrowScaleVal.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityVal.value,
      transform: [{ translateY: translateYVal.value }],
    };
  });

  const animatedArrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: arrowScaleVal.value }],
    };
  });

  // Logo mapping
  let providerColor = '#3B82F6';
  let providerInitial = 'Z';
  if (provider === 'zerodha') {
    providerColor = '#0052cc';
    providerInitial = 'Z';
  } else if (provider === 'groww') {
    providerColor = '#00d09c';
    providerInitial = 'G';
  } else if (provider === 'indmoney') {
    providerColor = '#3873f5';
    providerInitial = 'I';
  } else {
    providerColor = theme.colors.accent;
    providerInitial = 'P';
  }

  const pnlColor = isPositive ? 'income' : 'expense';
  const arrowIconName = isPositive ? 'arrow-up-right' : 'arrow-down-right';

  return (
    <Animated.View style={[animatedContainerStyle, style]}>
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
        <View row center={false} style={styles.topRow}>
          {/* Logo Circle */}
          <View row center={false} style={styles.providerInfo}>
            <View center style={[styles.logoCircle, { backgroundColor: providerColor }]}>
              <Text variant="bodySmall" style={{ fontWeight: '800', color: '#FFFFFF' }}>
                {providerInitial}
              </Text>
            </View>
            <View>
              <Text variant="bodySmall" style={{ fontWeight: '700' }} numberOfLines={1}>
                {holdingName}
              </Text>
              <Text variant="caption" color="secondary" style={styles.providerText}>
                via {provider.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Current Value Display */}
          <View style={styles.valueSection}>
            <Text variant="bodySmall" style={{ fontWeight: '700', textAlign: 'right' }}>
              {formatINR(currentValuePaise)}
            </Text>
            <Text variant="label" color="secondary" style={{ marginTop: 2, textAlign: 'right' }}>
              Current Value
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: theme.colors.border + '40' }]} />

        {/* P&L Bottom Section */}
        <View row center={false} style={styles.bottomRow}>
          <View>
            <Text variant="label" color="secondary">
              Invested: <Text variant="label" style={{ fontWeight: '700' }}>{formatINR(investedValuePaise)}</Text>
            </Text>
          </View>

          {/* Animated P&L Chip */}
          <View 
            row 
            center 
            style={[
              styles.pnlChip, 
              { backgroundColor: (isPositive ? theme.colors.income : theme.colors.expense) + '15' }
            ]}
          >
            <Animated.View style={animatedArrowStyle}>
              <Icon name={arrowIconName} size="sm" color={pnlColor} style={styles.arrowIcon} />
            </Animated.View>
            <Text variant="caption" color={pnlColor} style={{ fontWeight: '700' }}>
              {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}% ({formatINR(Math.abs(pnlPaise))})
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardBody: {
    width: '100%',
    marginVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  providerText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  valueSection: {
    justifyContent: 'center',
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
  pnlChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowIcon: {
    marginRight: 2,
  },
});

export default InvestmentCard;
