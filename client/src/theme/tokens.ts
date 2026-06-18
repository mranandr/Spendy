import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

// Static Design Tokens (8pt Grid System)
export const spacing = {
  0: 0,
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  8: 64,
  10: 80,
  12: 96,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    display: 40,
  },
  lineHeights: {
    xs: 14,
    sm: 16,
    base: 20,
    md: 24,
    lg: 26,
    xl: 28,
    '2xl': 32,
    '3xl': 38,
    '4xl': 44,
    display: 52,
  },
  letterSpacing: {
    xs: 0.2,
    sm: 0.1,
    base: 0,
    md: -0.1,
    lg: -0.2,
    xl: -0.3,
    '2xl': -0.4,
    '3xl': -0.5,
    '4xl': -0.6,
    display: -1.0,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
} as const;

export const zIndex = {
  base: 0,
  card: 1,
  dropdown: 10,
  sheet: 50,
  modal: 100,
  toast: 200,
} as const;

// Colors Type Definition to solve TypeScript literal constraints
export interface ColorPalette {
  background: string;
  surface: string;
  card: string;
  border: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  accent: string;      // Electric Indigo
  income: string;      // Emerald
  expense: string;     // Rose
  warning: string;     // Amber
  info: string;        // Blue
  accentGlow: string;
  incomeGlow: string;
  expenseGlow: string;
}

// Colors definition
export const colors = {
  dark: {
    background: '#0A0A0F',
    surface: '#12121A',
    card: '#1A1A26',
    border: '#262636',
    text: {
      primary: '#FFFFFF',
      secondary: '#9E9EAF',
      tertiary: '#646475',
      inverse: '#0A0A0F',
    },
    accent: '#6C63FF',
    income: '#10B981',
    expense: '#F43F5E',
    warning: '#F59E0B',
    info: '#3B82F6',
    accentGlow: 'rgba(108, 99, 255, 0.15)',
    incomeGlow: 'rgba(16, 185, 129, 0.1)',
    expenseGlow: 'rgba(244, 63, 94, 0.1)',
  },
  light: {
    background: '#FAFAFC',
    surface: '#F1F1F6',
    card: '#FFFFFF',
    border: '#E5E5EA',
    text: {
      primary: '#0C0C0F',
      secondary: '#6E6E7A',
      tertiary: '#9E9EAF',
      inverse: '#FFFFFF',
    },
    accent: '#6C63FF',
    income: '#10B981',
    expense: '#F43F5E',
    warning: '#F59E0B',
    info: '#3B82F6',
    accentGlow: 'rgba(108, 99, 255, 0.08)',
    incomeGlow: 'rgba(16, 185, 129, 0.08)',
    expenseGlow: 'rgba(244, 63, 94, 0.08)',
  },
} as const;

// Shadows (Platform specific presets can be defined, here we define base styling)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5.46,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 14.78,
    elevation: 12,
  },
  glow: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Unified Theme Type
export interface Theme {
  dark: boolean;
  colors: ColorPalette;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
  zIndex: typeof zIndex;
}

// Full theme definitions
export const darkTheme: Theme = {
  dark: true,
  colors: colors.dark,
  spacing,
  borderRadius,
  typography,
  shadows,
  zIndex,
};

export const lightTheme: Theme = {
  dark: false,
  colors: colors.light,
  spacing,
  borderRadius,
  typography,
  shadows,
  zIndex,
};

// Export a single static theme object representing the base scale / default light theme
export const theme = lightTheme;

// Dynamic theme hook backed by Zustand
export function useTheme(): Theme {
  // Use theme store to trigger re-renders on theme changes
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const deviceColorScheme = useDeviceColorScheme();

  const activeScheme =
    colorScheme === 'system' ? deviceColorScheme ?? 'light' : colorScheme;

  return activeScheme === 'light' ? lightTheme : darkTheme;
}
