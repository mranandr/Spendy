import React from 'react';
import { ViewStyle } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/tokens';

export interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'income' | 'expense' | 'warning' | 'info' | string;
  library?: 'lucide' | 'ionicons';
  style?: any;
}


export const Icon: React.FC<IconProps> = React.memo(({
  name,
  size = 'md',
  color = 'primary',
  library = 'lucide',
  style,
}) => {
  const theme = useTheme();

  // Resolve size
  let resolvedSize = 20;
  if (size === 'sm') resolvedSize = 16;
  else if (size === 'md') resolvedSize = 20;
  else if (size === 'lg') resolvedSize = 24;
  else if (size === 'xl') resolvedSize = 32;
  else if (typeof size === 'number') resolvedSize = size;

  // Resolve color
  let resolvedColor = theme.colors.text.primary;
  if (color === 'primary') resolvedColor = theme.colors.text.primary;
  else if (color === 'secondary') resolvedColor = theme.colors.text.secondary;
  else if (color === 'tertiary') resolvedColor = theme.colors.text.tertiary;
  else if (color === 'accent') resolvedColor = theme.colors.accent;
  else if (color === 'income') resolvedColor = theme.colors.income;
  else if (color === 'expense') resolvedColor = theme.colors.expense;
  else if (color === 'warning') resolvedColor = theme.colors.warning;
  else if (color === 'info') resolvedColor = theme.colors.info;
  else if (color) resolvedColor = color;

  if (library === 'lucide') {
    // Lucide names are PascalCase in imports but sometimes camelCase or kebab-case. 
    // We convert it to PascalCase to match Lucide exports.
    // e.g. "trending-up" -> "TrendingUp", "eye-off" -> "EyeOff"
    const pascalName = name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const LucideComponent = (LucideIcons as any)[pascalName];
    if (LucideComponent) {
      return <LucideComponent color={resolvedColor} size={resolvedSize} style={style} />;
    }
  }

  // Fallback to Ionicons
  const ioniconName = name as React.ComponentProps<typeof Ionicons>['name'];
  return <Ionicons name={ioniconName} size={resolvedSize} color={resolvedColor} style={style} />;
});

export default Icon;
