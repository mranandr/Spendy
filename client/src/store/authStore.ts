import { create } from 'zustand';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  completeGoogleCallback,
  fetchGoogleAuthUrl,
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  type AuthUser,
} from '../services/api/auth';
import { clearTokens, getRefreshToken, saveTokens } from '../lib/tokenStorage';
import {
  buildOAuthRedirectUrl,
  extractOAuthCallbackParams,
  getAuthSessionReturnUrl,
  getNativeOAuthPathsToTry,
  getOAuthRedirectUrl,
  isOAuthCallbackUrl,
} from '../lib/oauth';
import { useBrokerStore } from './brokerStore';
import { useFinanceStore } from './financeStore';

WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  joinedDate: string;
  preferredCurrency: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeGoogleFromUrl: (url: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

function mapUser(user: AuthUser): UserProfile {
  return {
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    joinedDate: user.joinedDate,
    preferredCurrency: user.preferredCurrency,
  };
}

async function applyTokenBundle(bundle: {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}): Promise<void> {
  await saveTokens({
    accessToken: bundle.access_token,
    refreshToken: bundle.refresh_token,
  });
  useAuthStore.setState({
    user: mapUser(bundle.user),
    isAuthenticated: true,
    isLoading: false,
  });
  try {
    await useFinanceStore.getState().loadFromServer();
  } catch {
    /* API may be offline */
  }
}

async function loadUserFinanceData(): Promise<void> {
  try {
    await useFinanceStore.getState().loadFromServer();
  } catch {
    /* local cache remains */
  }
}

// Pending OAuth state for native callback validation
let pendingOAuthState: string | null = null;
let pendingOAuthRedirect: string | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const me = await fetchMe();
      set({
        user: mapUser(me),
        isAuthenticated: true,
        isLoading: false,
      });
      await loadUserFinanceData();
    } catch {
      await clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const bundle = await apiLogin(email.trim().toLowerCase(), password);
      await applyTokenBundle(bundle);
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signUpWithEmail: async (email, password, name) => {
    set({ isLoading: true });
    try {
      const bundle = await apiRegister(email.trim().toLowerCase(), password, name.trim());
      await applyTokenBundle(bundle);
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  completeGoogleFromUrl: async (url: string) => {
    const { code, state } = extractOAuthCallbackParams(url);
    if (!code || !state) {
      throw new Error('OAuth callback missing code or state');
    }

    const redirectUri = pendingOAuthRedirect ?? getOAuthRedirectUrl();
    const bundle = await completeGoogleCallback(code, redirectUri, state);
    pendingOAuthState = null;
    pendingOAuthRedirect = null;
    await applyTokenBundle(bundle);
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });

    const returnUrl = getAuthSessionReturnUrl();
    const pathsToTry =
      Platform.OS === 'web'
        ? ['auth/callback']
        : __DEV__
          ? getNativeOAuthPathsToTry()
          : [process.env.EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_PATH?.trim() || 'auth/callback'];

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < pathsToTry.length; attempt++) {
      const routePath = pathsToTry[attempt];
      const redirectTo =
        Platform.OS === 'web' ? getOAuthRedirectUrl() : buildOAuthRedirectUrl(routePath);

      if (__DEV__) {
        console.log('[SSO] attempt', attempt + 1, 'route:', routePath, 'redirectTo:', redirectTo);
      }

      try {
        const { url, state } = await fetchGoogleAuthUrl(redirectTo);
        pendingOAuthState = state;
        pendingOAuthRedirect = redirectTo;

        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            window.location.assign(url);
          }
          return;
        }

        const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);

        if (__DEV__) {
          console.log('[SSO] result:', result.type, result.type === 'success' ? result.url : '');
        }

        if (result.type === 'success' && result.url) {
          await get().completeGoogleFromUrl(result.url);
          return;
        }

        if (result.type === 'cancel') {
          set({ isLoading: false });
          throw new Error('Google sign-in was cancelled');
        }

        if (result.type === 'dismiss' && attempt < pathsToTry.length - 1) {
          if (__DEV__) console.log('[SSO] dismiss — trying route:', pathsToTry[attempt + 1]);
          lastError = new Error('Redirect mismatch — retrying');
          continue;
        }

        lastError = new Error('Google sign-in did not complete');
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Google sign-in failed');
        if (attempt >= pathsToTry.length - 1) break;
      }
    }

    set({ isLoading: false });
    throw lastError ?? new Error('Google sign-in failed');
  },

  logout: async () => {
    set({ isLoading: true });
    const refreshToken = await getRefreshToken();
    try {
      await apiLogout(refreshToken);
    } catch {
      /* revoke best-effort */
    }
    await clearTokens();
    useBrokerStore.getState().reset();
    useFinanceStore.getState().resetAllData();
    set({ isAuthenticated: false, user: null, isLoading: false });
  },

  updateProfile: (profile) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...profile } : null,
    }));
  },
}));

/** Handle cold-start / deep-link OAuth without going through signInWithGoogle. */
export async function tryCompleteOAuthFromUrl(url: string): Promise<boolean> {
  if (!isOAuthCallbackUrl(url)) return false;
  try {
    await useAuthStore.getState().completeGoogleFromUrl(url);
    return true;
  } catch {
    return false;
  }
}

export function listenForOAuthDeepLinks(): () => void {
  const handler = ({ url }: { url: string }) => {
    void tryCompleteOAuthFromUrl(url);
  };
  const sub = Linking.addEventListener('url', handler);
  return () => sub.remove();
}
