import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, StyleProp, ViewStyle, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle, Line } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/tokens';
import { View, Text } from '../primitives';
import { formatINR } from '../../utils/currency';

export interface LineChartProps {
  data: number[]; // Array of values (paise)
  labels: string[]; // X axis labels
  style?: StyleProp<ViewStyle>;
}

export const LineChart: React.FC<LineChartProps> = React.memo(({
  data,
  labels,
  style,
}) => {
  const theme = useTheme();
  
  // Interactive touch states
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 32);

  const chartHeight = 180;
  const padding = 20;

  // Mount animation value
  const chartAnimation = useSharedValue(0);

  useEffect(() => {
    chartAnimation.value = withTiming(1, { duration: 1200 });
  }, []);

  if (data.length < 2) {
    return (
      <View center padding="lg" style={[styles.emptyContainer, style]}>
        <Text variant="bodySmall" color="secondary">
          Not enough historical points
        </Text>
      </View>
    );
  }

  // Calculate min/max for scaling
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const valRange = maxVal - minVal || 1;

  // Map data to SVG coordinates
  const contentWidth = chartWidth - padding * 2;
  const contentHeight = chartHeight - padding * 2;

  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * contentWidth;
    
    // Scale vertically (y goes down in SVG)
    const normalizedY = (val - minVal) / valRange;
    const y = padding + contentHeight - (normalizedY * contentHeight);
    
    return { x, y };
  });

  // Generate cubic Bezier smooth path
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = generateSmoothPath(points);

  // Generate smooth filled path below curve
  const fillPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : '';

  // Handle scrub touch events
  const handleTouch = (evt: any) => {
    const touchX = evt.nativeEvent.locationX;
    
    // Calculate nearest point
    const relativeX = touchX - padding;
    const ratio = relativeX / contentWidth;
    const index = Math.round(ratio * (data.length - 1));
    const cappedIndex = Math.max(0, Math.min(index, data.length - 1));

    if (scrubIndex !== cappedIndex) {
      setScrubIndex(cappedIndex);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const handleTouchEnd = () => {
    setScrubIndex(null);
  };

  const activePoint = scrubIndex !== null ? points[scrubIndex] : null;
  const activeValue = scrubIndex !== null ? data[scrubIndex] : null;
  const activeLabel = scrubIndex !== null ? labels[scrubIndex] : null;

  return (
    <View 
      style={[styles.container, style]}
      onLayout={(evt) => setChartWidth(evt.nativeEvent.layout.width)}
    >
      {/* Floating Scrub Tooltip */}
      <View style={styles.tooltipHeightWrapper}>
        {scrubIndex !== null && activeValue !== null && activeLabel !== null ? (
          <View center style={styles.tooltipContainer}>
            <Text variant="caption" color="secondary" style={styles.tooltipLabel}>
              {activeLabel}
            </Text>
            <Text variant="bodySmall" style={{ fontWeight: '800', marginTop: 2 }}>
              {formatINR(activeValue)}
            </Text>
          </View>
        ) : (
          <View center style={styles.tooltipContainerPlaceholder}>
            <Text variant="caption" color="secondary" style={styles.helperText}>
              Drag across the chart to view details
            </Text>
          </View>
        )}
      </View>

      {/* SVG Canvas with Touches */}
      <View 
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={styles.svgContainer}
      >
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <SvgLinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.accent} stopOpacity="0.32" />
              <Stop offset="100%" stopColor={theme.colors.accent} stopOpacity="0.0" />
            </SvgLinearGradient>
          </Defs>

          {/* Gradient Fill under path */}
          {fillPath && (
            <Path d={fillPath} fill="url(#chartGradient)" />
          )}

          {/* Smooth Bezier Line */}
          {linePath && (
            <Path 
              d={linePath} 
              stroke={theme.colors.accent} 
              strokeWidth="3.5" 
              fill="none" 
            />
          )}

          {/* scrubbing indicators */}
          {activePoint && (
            <>
              {/* Vertical scrub crosshair */}
              <Line 
                x1={activePoint.x} 
                y1={padding} 
                x2={activePoint.x} 
                y2={chartHeight - padding} 
                stroke={theme.colors.border} 
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              
              {/* Halo Outer Glow */}
              <Circle 
                cx={activePoint.x} 
                cy={activePoint.y} 
                r="10" 
                fill={theme.colors.accent + '25'} 
              />

              {/* Active Center Dot */}
              <Circle 
                cx={activePoint.x} 
                cy={activePoint.y} 
                r="5" 
                fill={theme.colors.accent} 
                stroke={theme.colors.card}
                strokeWidth="1.5"
              />
            </>
          )}
        </Svg>
      </View>

      {/* Simple X Axis representation */}
      <View row center={false} style={styles.xAxis}>
        <Text variant="caption" color="secondary" style={styles.axisText}>
          {labels[0]}
        </Text>
        <Text variant="caption" color="secondary" style={styles.axisText}>
          {labels[Math.round((labels.length - 1) / 2)]}
        </Text>
        <Text variant="caption" color="secondary" style={styles.axisText}>
          {labels[labels.length - 1]}
        </Text>
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
    height: 220,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipHeightWrapper: {
    height: 52,
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
  },
  tooltipContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignSelf: 'center',
  },
  tooltipContainerPlaceholder: {
    alignSelf: 'center',
  },
  tooltipLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  helperText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  svgContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  axisText: {
    fontWeight: '700',
    fontSize: 10,
  },
});

export default LineChart;
