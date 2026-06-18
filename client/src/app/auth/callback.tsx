import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { getCurrentAuthCallbackUrl, isOAuthCallbackUrl } from '../../lib/oauth';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/tokens';
import { Text } from '../../components/primitives';

/** Google OAuth callback — exchanges code with Spendy API for JWT. */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const completeGoogleFromUrl = useAuthStore((s) => s.completeGoogleFromUrl);
  const [error, setError] = useState('');

  useEffect(() => {
    const finishSignIn = async (url: string) => {
      try {
        await completeGoogleFromUrl(url);
        router.replace('/(app)/dashboard' as any);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Sign-in failed';
        setError(msg);
      }
    };

    const webUrl = getCurrentAuthCallbackUrl();
    if (webUrl && isOAuthCallbackUrl(webUrl)) {
      finishSignIn(webUrl);
      return;
    }

    Linking.getInitialURL().then((url) => {
      if (url && isOAuthCallbackUrl(url)) finishSignIn(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      if (isOAuthCallbackUrl(url)) finishSignIn(url);
    });
    return () => sub.remove();
  }, [router, completeGoogleFromUrl]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        paddingHorizontal: 24,
      }}
    >
      {error ? (
        <Text variant="bodySmall" color="expense" style={{ textAlign: 'center' }}>
          {error}
        </Text>
      ) : (
        <ActivityIndicator color={theme.colors.accent} />
      )}
    </View>
  );
}
