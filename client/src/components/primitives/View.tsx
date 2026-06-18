import React from 'react';
import { View as RNView, ViewStyle, StyleSheet, ViewProps as RNViewProps, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/tokens';

export interface ViewProps extends RNViewProps {
  variant?: 'screen' | 'card' | 'surface' | 'transparent';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | number;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | number;
  flex?: number;
  row?: boolean;
  center?: boolean;
  safe?: boolean;
  style?: StyleProp<ViewStyle>;
}


export const View: React.FC<ViewProps> = React.memo(({
  variant = 'transparent',
  padding,
  gap,
  flex,
  row = false,
  center = false,
  safe = false,
  style,
  children,
  ...props
}) => {
  const theme = useTheme();

  // Resolve backgrounds
  let backgroundColor = 'transparent';
  if (variant === 'screen') backgroundColor = theme.colors.background;
  else if (variant === 'surface') backgroundColor = theme.colors.surface;
  else if (variant === 'card') backgroundColor = theme.colors.card;

  // Resolve padding
  let resolvedPadding: number | undefined;
  if (typeof padding === 'number') {
    resolvedPadding = padding;
  } else if (padding && padding !== 'none') {
    resolvedPadding = theme.spacing[padding as keyof typeof theme.spacing];
  }

  // Resolve gap
  let resolvedGap: number | undefined;
  if (typeof gap === 'number') {
    resolvedGap = gap;
  } else if (gap && gap !== 'none') {
    resolvedGap = theme.spacing[gap as keyof typeof theme.spacing];
  }

  const containerStyle: ViewStyle = {
    backgroundColor,
    flex,
    flexDirection: row ? 'row' : 'column',
    alignItems: center ? 'center' : undefined,
    justifyContent: center ? 'center' : undefined,
    padding: resolvedPadding,
    gap: resolvedGap,
  };

  // Card specific style
  const cardStyle: ViewStyle = variant === 'card' ? {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  } : {};

  const Component = safe ? SafeAreaView : RNView;

  return (
    <Component style={[containerStyle, cardStyle, style]} {...props}>
      {children}
    </Component>
  );
});

export default View;
