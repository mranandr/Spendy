import React from 'react';
import { ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { useTheme } from '../../theme/tokens';

export interface GradientProps extends Omit<LinearGradientProps, 'colors'> {
  preset?: 'primary' | 'income' | 'expense' | 'card' | 'dark';
  colors?: string[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}


export const Gradient = React.memo<GradientProps>(function Gradient({
  preset = 'primary',
  colors: customColors,
  style,
  children,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  ...props
}) {
  const theme = useTheme();

  // Resolve colors based on preset
  let resolvedColors: string[] = [];

  if (customColors && customColors.length > 0) {
    resolvedColors = customColors;
  } else {
    switch (preset) {
      case 'primary':
        resolvedColors = theme.dark 
          ? ['#6C63FF', '#493EFC'] 
          : ['#6C63FF', '#837BFF'];
        break;
      case 'income':
        resolvedColors = ['#10B981', '#059669'];
        break;
      case 'expense':
        resolvedColors = ['#F43F5E', '#D01C3E'];
        break;
      case 'card':
        resolvedColors = theme.dark 
          ? ['#1A1A26', '#12121A'] 
          : ['#FFFFFF', '#F9F9FB'];
        break;
      case 'dark':
        resolvedColors = ['#0A0A0F', '#1A1A2C'];
        break;
    }
  }

  // Card specific layout adjustments if applying cards
  const cardBorderRadiusStyle = preset === 'card' ? {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  } : {};

  return (
    <LinearGradient
      colors={resolvedColors as [any, any, ...any[]]}
      start={start}
      end={end}
      style={[cardBorderRadiusStyle, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
});


export default Gradient;
