import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Redirect, useRouter } from 'expo-router';
import { tryCompleteOAuthFromUrl, useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/tokens';
import { isOAuthCallbackUrl } from '../lib/oauth';

export default function Index() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const [pendingOAuth, setPendingOAuth] = useState(Platform.OS !== 'web');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const finishOAuth = async (url: string) => {
      if (!isOAuthCallbackUrl(url)) return false;
      const ok = await tryCompleteOAuthFromUrl(url);
      if (ok) router.replace('/(app)/dashboard' as any);
      return ok;
    };

    Linking.getInitialURL().then(async (url) => {
      if (url && (await finishOAuth(url))) return;
      setPendingOAuth(false);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      void finishOAuth(url);
    });
    return () => sub.remove();
  }, [router]);

  if (isLoading || pendingOAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/(app)/dashboard" as any} />;
  }

  return <Redirect href={"/auth/login" as any} />;
}
