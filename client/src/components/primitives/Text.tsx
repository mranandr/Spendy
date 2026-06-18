import React from 'react';
import { Text as RNText, TextStyle, StyleSheet, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../../theme/tokens';

export interface TextProps extends RNTextProps {
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label' | 'monospace';
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent' | 'income' | 'expense' | 'warning' | 'info' | string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'black';
  align?: 'left' | 'center' | 'right' | 'justify';
}

export const Text: React.FC<TextProps> = React.memo(({
  variant = 'body',
  color = 'primary',
  weight,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const theme = useTheme();

  // Resolve color
  let textColor = theme.colors.text.primary;
  if (color === 'primary') textColor = theme.colors.text.primary;
  else if (color === 'secondary') textColor = theme.colors.text.secondary;
  else if (color === 'tertiary') textColor = theme.colors.text.tertiary;
  else if (color === 'inverse') textColor = theme.colors.text.inverse;
  else if (color === 'accent') textColor = theme.colors.accent;
  else if (color === 'income') textColor = theme.colors.income;
  else if (color === 'expense') textColor = theme.colors.expense;
  else if (color === 'warning') textColor = theme.colors.warning;
  else if (color === 'info') textColor = theme.colors.info;
  else if (color) textColor = color;

  // Variant styles map
  const variantStyles = stylesMap[variant];

  // Resolve font weight
  const fontWeight = weight 
    ? theme.typography.weights[weight] 
    : variantStyles.fontWeight || theme.typography.weights.regular;

  const combinedStyle: TextStyle = {
    color: textColor,
    fontSize: variantStyles.fontSize,
    lineHeight: variantStyles.lineHeight,
    letterSpacing: variantStyles.letterSpacing,
    fontWeight: fontWeight as TextStyle['fontWeight'],
    textAlign: align,
  };

  return (
    <RNText style={[combinedStyle, style]} {...props}>
      {children}
    </RNText>
  );
});

// Explicit style mappings based on tokens
const stylesMap = {
  display: {
    fontSize: 40,
    lineHeight: 52,
    letterSpacing: -1.0,
    fontWeight: '700',
  },
  h1: {
    fontSize: 32,
    lineHeight: 44,
    letterSpacing: -0.6,
    fontWeight: '700',
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
    fontWeight: '600',
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    fontWeight: '400',
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  monospace: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    fontWeight: '400',
    fontFamily: 'monospace',
  },
};

export default Text;

