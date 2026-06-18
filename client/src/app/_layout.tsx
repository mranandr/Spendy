import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { useTheme } from '../theme/tokens';
import { tryCompleteOAuthFromUrl, useAuthStore } from '../store/authStore';
import { isOAuthCallbackUrl } from '../lib/oauth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const theme = useTheme();
  const router = useRouter();
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleDeepLink = async (url: string) => {
      if (!isOAuthCallbackUrl(url)) return;
      const ok = await tryCompleteOAuthFromUrl(url);
      if (ok) router.replace('/(app)/dashboard' as any);
    };

    Linking.getInitialURL().then((url) => {
      if (url) void handleDeepLink(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleDeepLink(url);
    });
    return () => sub.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={theme.dark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
          <Slot />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
