import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, StyleProp, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { useTheme } from '../../theme/tokens';
import { View, Text } from '../primitives';
import { formatCompact } from '../../utils/currency';

export interface BarChartData {
  label: string;
  income: number; // paise
  expense: number; // paise
}

export interface BarChartProps {
  data: BarChartData[];
  mode?: 'grouped' | 'stacked';
  style?: StyleProp<ViewStyle>;
}

const AnimatedBar: React.FC<{
  heightPercent: number;
  color: string;
  delay?: number;
}> = React.memo(({ heightPercent, color }) => {
  const heightAnim = useSharedValue(0);

  useEffect(() => {
    heightAnim.value = withTiming(heightPercent, { duration: 800 });
  }, [heightPercent]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: `${heightAnim.value * 100}%`,
    };
  });

  return (
    <Animated.View 
      style={[
        styles.barFill, 
        { backgroundColor: color },
        animatedStyle
      ]} 
    />
  );
});

export const BarChart: React.FC<BarChartProps> = React.memo(({
  data,
  mode = 'grouped',
  style,
}) => {
  const theme = useTheme();

  const chartHeight = 160;

  // Calculate global maximum value for scaling
  const maxVal = data.reduce((max, item) => {
    if (mode === 'stacked') {
      const sum = item.income + item.expense;
      return sum > max ? sum : max;
    } else {
      const localMax = Math.max(item.income, item.expense);
      return localMax > max ? localMax : max;
    }
  }, 1);

  // Quick safety fallback
  if (data.length === 0) {
    return (
      <View center padding="lg" style={[styles.emptyContainer, style]}>
        <Text variant="bodySmall" color="secondary">
          No comparison data available
        </Text>
      </View>
    );
  }

  // Draw vertical grid indicators (e.g. Max, Mid, Zero)
  const gridLines = [
    { label: formatCompact(maxVal), value: 1 },
    { label: formatCompact(maxVal / 2), value: 0.5 },
    { label: '₹0', value: 0 },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Legend Header */}
      <View row center={false} style={styles.legendRow}>
        <View row center style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: theme.colors.income }]} />
          <Text variant="caption" color="secondary" style={{ fontWeight: '600' }}>
            Income
          </Text>
        </View>
        <View row center style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: theme.colors.expense }]} />
          <Text variant="caption" color="secondary" style={{ fontWeight: '600' }}>
            Expense
          </Text>
        </View>
      </View>

      <View row center={false} style={styles.chartArea}>
        {/* Y Axis Grid lines */}
        <View style={styles.yAxis}>
          {gridLines.map((line, idx) => (
            <Text 
              key={idx} 
              variant="label" 
              color="secondary" 
              style={[
                styles.gridLabel, 
                { bottom: `${line.value * 82}%` }
              ]}
            >
              {line.label}
            </Text>
          ))}
        </View>

        {/* Scrollable Columns */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {data.map((item, idx) => {
            const incomeRatio = item.income / maxVal;
            const expenseRatio = item.expense / maxVal;

            return (
              <View key={idx} center={false} style={styles.columnContainer}>
                {/* Visual Bar Area */}
                <View style={[styles.barViewport, { height: chartHeight }]}>
                  {mode === 'grouped' ? (
                    // Grouped Mode: Side-by-Side
                    <View row style={styles.groupedContainer}>
                      <View style={[styles.barTrack, { backgroundColor: theme.colors.surface }]}>
                        <AnimatedBar heightPercent={incomeRatio} color={theme.colors.income} />
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: theme.colors.surface }]}>
                        <AnimatedBar heightPercent={expenseRatio} color={theme.colors.expense} />
                      </View>
                    </View>
                  ) : (
                    // Stacked Mode: Single stacked bar
                    <View style={[styles.barTrackStacked, { backgroundColor: theme.colors.surface }]}>
                      {/* Income on top, Expense below */}
                      <View style={styles.stackedFillContainer}>
                        <AnimatedBar heightPercent={incomeRatio + expenseRatio} color={theme.colors.expense} />
                        {/* We overlap/layer income bar to visually stack */}
                        <View style={styles.incomeStackOverlay}>
                          <AnimatedBar heightPercent={incomeRatio / (incomeRatio + expenseRatio || 1)} color={theme.colors.income} />
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* X Axis label */}
                <Text variant="caption" color="secondary" style={styles.xAxisLabel}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </ScrollView>
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
    height: 180,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  yAxis: {
    width: 48,
    position: 'relative',
    height: 160,
  },
  gridLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 9,
    fontWeight: '700',
  },
  scrollContainer: {
    paddingHorizontal: 4,
    gap: 20,
  },
  columnContainer: {
    alignItems: 'center',
    width: 48,
  },
  barViewport: {
    width: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  groupedContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barTrackStacked: {
    width: 18,
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignSelf: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  stackedFillContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  incomeStackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  xAxisLabel: {
    marginTop: 8,
    fontWeight: '700',
    fontSize: 10,
  },
});

export default BarChart;
