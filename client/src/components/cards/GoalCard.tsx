import React, { useEffect } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming 
} from 'react-native-reanimated';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../primitives';
import { formatINR } from '../../utils/currency';
import { getDaysRemaining } from '../../utils/date';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface GoalCardProps {
  id: string;
  name: string;
  icon: string;
  targetAmountPaise: number; // paise
  currentAmountPaise: number; // paise
  targetDate: Date | string | number;
  style?: StyleProp<ViewStyle>;
}

export const GoalCard: React.FC<GoalCardProps> = React.memo(({
  id,
  name,
  icon,
  targetAmountPaise,
  currentAmountPaise,
  targetDate,
  style,
}) => {
  const theme = useTheme();

  const ratio = targetAmountPaise > 0 ? currentAmountPaise / targetAmountPaise : 0;
  const percentage = Math.round(ratio * 100);
  const cappedRatio = Math.min(ratio, 1);

  // SVG Circular progress constants
  const size = 68;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Reanimated shared progress
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(cappedRatio, { duration: 1000 });
  }, [cappedRatio]);

  // Animate SVG strokeDashoffset prop
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const daysLeft = getDaysRemaining(targetDate);

  return (
    <View 
      variant="card" 
      padding="md" 
      style={[
        styles.cardBody, 
        { 
          backgroundColor: theme.colors.card, 
          borderColor: theme.colors.border 
        }, 
        style
      ]}
    >
      <View row center={false} style={styles.contentRow}>
        
        {/* Left Side: Goal Info */}
        <View style={styles.leftColumn}>
          <View row center={false} style={styles.titleRow}>
            <View center style={[styles.iconCircle, { backgroundColor: theme.colors.accentGlow }]}>
              <Icon name={icon} size="sm" color="accent" />
            </View>
            <View>
              <Text variant="bodySmall" style={{ fontWeight: '700' }}>
                {name}
              </Text>
              <Text variant="caption" color="secondary" style={styles.daysText}>
                {daysLeft > 0 ? `${daysLeft} days remaining` : 'Target date reached'}
              </Text>
            </View>
          </View>

          {/* Amount Info */}
          <View style={styles.amountSection}>
            <Text variant="body" color="accent" style={{ fontWeight: '800' }}>
              {formatINR(currentAmountPaise)}
            </Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
              saved of <Text variant="caption" style={{ fontWeight: '700' }}>{formatINR(targetAmountPaise)}</Text>
            </Text>
          </View>
        </View>

        {/* Right Side: Animated Circular Progress SVG */}
        <View center style={styles.ringContainer}>
          <Svg width={size} height={size}>
            {/* Background Track Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.border}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated Fill Circle */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.accent}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          
          {/* Centered Percentage Label */}
          <View center style={styles.percentageCenter}>
            <Text variant="caption" style={{ fontWeight: '800', fontSize: 11 }}>
              {percentage}%
            </Text>
          </View>
        </View>

      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardBody: {
    width: '100%',
    marginVertical: 4,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  daysText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  amountSection: {
    paddingLeft: 4,
  },
  ringContainer: {
    position: 'relative',
    width: 68,
    height: 68,
  },
  percentageCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default GoalCard;
