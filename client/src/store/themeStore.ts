import { create } from 'zustand';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from '../theme/tokens';

export interface ThemeState {
  colorScheme: 'light' | 'dark' | 'system';
  setTheme: (scheme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  getComputedTheme: () => Theme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: 'light',
  setTheme: (scheme) => set({ colorScheme: scheme }),
  toggleTheme: () =>
    set((state) => ({
      colorScheme: state.colorScheme === 'dark' ? 'light' : 'dark',
    })),
  getComputedTheme: () => {
    const { colorScheme } = get();
    return colorScheme === 'light' ? lightTheme : darkTheme;
  },
}));

export default useThemeStore;
