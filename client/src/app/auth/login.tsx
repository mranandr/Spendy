import React, { useState, useEffect } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTheme } from '../../theme/tokens';
import { tryCompleteOAuthFromUrl, useAuthStore } from '../../store/authStore';
import { isOAuthCallbackUrl } from '../../lib/oauth';
import { View, Text, Icon, Pressable, Gradient } from '../../components/primitives';
import { TextInput } from '../../components/inputs';

const spendyLogo = require('../../../assets/spendy/icon.png');

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Native OAuth may redirect to auth/login?code=...
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const finishOAuth = async (url: string) => {
      if (!isOAuthCallbackUrl(url)) return;
      const ok = await tryCompleteOAuthFromUrl(url);
      if (ok) router.replace('/(app)/dashboard' as any);
    };

    Linking.getInitialURL().then((url) => {
      if (url) void finishOAuth(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      void finishOAuth(url);
    });
    return () => sub.remove();
  }, [router]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (isSignUp && !name.trim())) {
      setError('Please fill in all fields');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim().toLowerCase(), password, name.trim());
      } else {
        await signInWithEmail(email.trim().toLowerCase(), password);
      }
      router.replace('/(app)/dashboard' as any);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      if (Platform.OS !== 'web') {
        router.replace('/(app)/dashboard' as any);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(msg);
    } finally {
      if (Platform.OS !== 'web') {
        setIsLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Gradient preset="primary" style={styles.topAccent} />

        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image source={spendyLogo} style={styles.logo} contentFit="contain" />
          </View>
          <Text variant="h1" style={styles.title}>
            Spendy
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
            Smart personal finance, secured with enterprise JWT
          </Text>
        </View>

        <View style={styles.cardWrap}>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <Text variant="h3" style={styles.cardTitle}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text variant="caption" color="secondary" style={styles.cardSubtitle}>
              {isSignUp ? 'Sign up to sync your portfolio' : 'Sign in to your workspace'}
            </Text>

            {error ? (
              <Text variant="caption" color="expense" style={styles.errorText}>
                {error}
              </Text>
            ) : null}

            <Pressable
              onPress={handleGoogle}
              disabled={isLoading}
              style={[styles.ssoButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            >
              <Icon name="globe" size="sm" color="primary" style={{ marginRight: 10 }} />
              <Text variant="bodySmall" style={{ fontWeight: '700' }}>
                {isLoading ? 'Please wait...' : 'Continue with Google'}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text variant="caption" color="secondary" style={styles.dividerText}>
                or sign in with email
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            <View style={styles.formGroup}>
              {isSignUp ? (
                <TextInput
                  label="Full Name"
                  placeholder="E.g. Alex Johnson"
                  value={name}
                  onChangeText={setName}
                  leftIcon="user"
                  floatingLabel={false}
                />
              ) : null}

              <TextInput
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail"
                floatingLabel={false}
              />

              <TextInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon="shield"
                floatingLabel={false}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.signInButton, { backgroundColor: theme.colors.accent }]}
            >
              <Text variant="body" color="inverse" style={{ fontWeight: '700' }}>
                {isLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            </Pressable>

            <Pressable onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleMode}>
              <Text variant="caption" color="accent" style={{ fontWeight: '700' }}>
                {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    opacity: 0.12,
  },
  headerSection: { alignItems: 'center', marginBottom: 28 },
  logoContainer: {
    width: 88,
    height: 88,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 88,
    height: 88,
  },
  title: { fontWeight: '900', fontSize: 28, letterSpacing: -0.5 },
  subtitle: { fontWeight: '600', marginTop: 6, textAlign: 'center', maxWidth: 280 },
  cardWrap: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  cardTitle: { fontWeight: '800', textAlign: 'center' },
  cardSubtitle: { fontWeight: '500', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  errorText: { fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  ssoButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  formGroup: {
    width: '100%',
    alignItems: 'stretch',
  },
  signInButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  toggleMode: { marginTop: 16, alignItems: 'center' },
});
