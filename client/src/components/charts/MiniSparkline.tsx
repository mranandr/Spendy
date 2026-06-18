import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/tokens';
import { View } from '../primitives';

export interface MiniSparklineProps {
  data: number[];
  variant?: 'up' | 'down' | 'flat';
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = React.memo(({
  data,
  variant = 'flat',
  width = 80,
  height = 36,
  style,
}) => {
  const theme = useTheme();

  if (data.length < 2) {
    return null;
  }

  // Determine variant styling color
  let sparkColor = '#646475';
  if (variant === 'up') sparkColor = theme.colors.income;
  else if (variant === 'down') sparkColor = theme.colors.expense;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const valRange = maxVal - minVal || 1;

  const padding = 2;
  const contentWidth = width - padding * 2;
  const contentHeight = height - padding * 2;

  // Map to coordinates
  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * contentWidth;
    const normalizedY = (val - minVal) / valRange;
    const y = padding + contentHeight - (normalizedY * contentHeight);
    return { x, y };
  });

  // Smooth Bezier path generator
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
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
  
  // Filled path below sparkline
  const fillPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  const gradientId = `sparkGradient-${variant}-${Math.random()}`;

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={sparkColor} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={sparkColor} stopOpacity="0.0" />
          </SvgLinearGradient>
        </Defs>

        {/* Filled Area */}
        {fillPath && (
          <Path d={fillPath} fill={`url(#${gradientId})`} />
        )}

        {/* Curve Line */}
        {linePath && (
          <Path 
            d={linePath} 
            stroke={sparkColor} 
            strokeWidth="1.8" 
            fill="none" 
          />
        )}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MiniSparkline;
