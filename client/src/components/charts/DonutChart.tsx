import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/tokens';
import { View, Text } from '../primitives';
import { formatINR } from '../../utils/currency';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface DonutSegment {
  key: string;
  value: number; // paise
  color: string;
  label: string;
}

export interface DonutChartProps {
  data: DonutSegment[];
  style?: StyleProp<ViewStyle>;
}

export const DonutChart: React.FC<DonutChartProps> = React.memo(({
  data,
  style,
}) => {
  const theme = useTheme();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // SVG parameters
  const size = 200;
  const radius = 68;
  const strokeWidth = 16;
  const activeStrokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  // Mount animation value
  const chartAnimation = useSharedValue(0);

  useEffect(() => {
    chartAnimation.value = withTiming(1, { duration: 1000 });
  }, []);

  const handleSegmentPress = (key: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    
    if (selectedKey === key) {
      setSelectedKey(null);
    } else {
      setSelectedKey(key);
    }
  };

  // Safe division check
  if (total === 0) {
    return (
      <View center padding="lg" style={[styles.emptyContainer, style]}>
        <Text variant="bodySmall" color="secondary">
          No transaction data available
        </Text>
      </View>
    );
  }

  // Calculate cumulative percentages
  let cumulativePercentage = 0;

  // Find active segment info
  const activeSegment = data.find(item => item.key === selectedKey);

  return (
    <View center style={[styles.container, style]}>
      {/* Chart Center Area */}
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Draw segments */}
            {data.map((segment) => {
              const percentage = segment.value / total;
              const strokeLength = percentage * circumference;
              const strokeGap = circumference - strokeLength;
              
              // Shift starting offset by cumulative percentages
              const strokeOffset = circumference - (cumulativePercentage * circumference);
              cumulativePercentage += percentage;

              const isSelected = selectedKey === segment.key;
              const currentStrokeWidth = isSelected ? activeStrokeWidth : strokeWidth;

              // Reanimated props for draw-in on mount
              const animatedProps = useAnimatedProps(() => {
                return {
                  strokeDasharray: `${strokeLength * chartAnimation.value} ${circumference}`,
                };
              });

              return (
                <AnimatedCircle
                  key={segment.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={currentStrokeWidth}
                  strokeDasharray={`${strokeLength} ${strokeGap}`}
                  animatedProps={animatedProps}
                  strokeDashoffset={strokeOffset}
                  fill="none"
                  onPress={() => handleSegmentPress(segment.key)}
                />
              );
            })}
          </G>
        </Svg>

        {/* Center Text inside Donut hole */}
        <View center style={styles.centerTextContainer}>
          <Text variant="caption" color="secondary" style={styles.centerLabel}>
            {activeSegment ? activeSegment.label : 'Total Expense'}
          </Text>
          <Text variant="body" style={{ fontWeight: '800', marginTop: 2 }}>
            {activeSegment 
              ? formatINR(activeSegment.value) 
              : formatINR(total)
            }
          </Text>
          {activeSegment && (
            <Text variant="label" color="accent" style={{ fontWeight: '700', marginTop: 2 }}>
              {((activeSegment.value / total) * 100).toFixed(0)}%
            </Text>
          )}
        </View>
      </View>

      {/* Legend below */}
      <View style={styles.legendGrid}>
        {data.map((segment) => {
          const isSelected = selectedKey === segment.key;
          const percentage = ((segment.value / total) * 100).toFixed(0);

          return (
            <TouchableOpacity
              key={segment.key}
              activeOpacity={0.8}
              onPress={() => handleSegmentPress(segment.key)}
              style={[
                styles.legendItem,
                { 
                  backgroundColor: isSelected ? theme.colors.card : 'transparent',
                  borderColor: isSelected ? theme.colors.border : 'transparent',
                }
              ]}
            >
              <View row center={false} style={styles.legendLeft}>
                <View style={[styles.legendIndicator, { backgroundColor: segment.color }]} />
                <Text variant="caption" style={{ fontWeight: isSelected ? '700' : '500' }}>
                  {segment.label}
                </Text>
              </View>
              <Text variant="caption" color="secondary" style={{ fontWeight: '700' }}>
                {percentage}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  emptyContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartWrapper: {
    position: 'relative',
    width: 200,
    height: 200,
  },
  centerTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  centerLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 9,
    fontWeight: '600',
  },
  legendGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    width: '47%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default DonutChart;
