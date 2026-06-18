import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

const WEB_CALLBACK_PATH = 'auth/callback';

export const NATIVE_OAUTH_ROUTE_CANDIDATES = [
  'auth/callback',
  'auth/login',
  'index',
  '/',
] as const;

function getAppScheme(): string {
  const fromExtra = Constants.expoConfig?.scheme;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;
  return 'spendy';
}

function normalizeRoutePath(path: string): string {
  const trimmed = path.trim().replace(/^\/+/, '');
  return trimmed || '/';
}

function getWebOAuthRedirectUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/${WEB_CALLBACK_PATH}`;
  }
  return 'http://localhost:8082/auth/callback';
}

export function buildOAuthRedirectUrl(routePath: string): string {
  if (Platform.OS === 'web') {
    return getWebOAuthRedirectUrl();
  }

  const path = normalizeRoutePath(routePath);
  const redirectUri =
    path === '/' ? Linking.createURL('/') : Linking.createURL(path);

  if (
    redirectUri.startsWith('http://') ||
    redirectUri.startsWith('https://') ||
    redirectUri.includes('localhost')
  ) {
    const scheme = getAppScheme();
    return path === '/' ? `${scheme}://` : `${scheme}://${path}`;
  }

  return redirectUri;
}

export function getOAuthRedirectUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_PATH?.trim();
  return buildOAuthRedirectUrl(fromEnv || 'auth/callback');
}

/** Prefix for WebBrowser.openAuthSessionAsync — matches any path on this host. */
export function getAuthSessionReturnUrl(): string {
  if (Platform.OS === 'web') {
    return getWebOAuthRedirectUrl();
  }

  const sample = Linking.createURL('auth/callback');
  const expMatch = sample.match(/^exp:\/\/([^/?#]+)/);
  if (expMatch?.[1]) {
    return `exp://${expMatch[1]}`;
  }

  const webLan = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (webLan) {
    try {
      const u = new URL(webLan);
      return `${u.protocol}//${u.host}`;
    } catch {
      /* ignore */
    }
  }

  return `${getAppScheme()}://`;
}

export function getNativeOAuthPathsToTry(): string[] {
  const preferred = process.env.EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_PATH?.trim() || 'auth/callback';
  const ordered = [preferred, ...NATIVE_OAUTH_ROUTE_CANDIDATES];
  return [...new Set(ordered.map(normalizeRoutePath))];
}

function queryParam(
  params: Linking.QueryParams | null | undefined,
  key: string
): string | null {
  const value = params?.[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return null;
}

export function extractOAuthCallbackParams(url: string): {
  code: string | null;
  state: string | null;
} {
  const parsed = Linking.parse(url);
  return {
    code: queryParam(parsed.queryParams, 'code'),
    state: queryParam(parsed.queryParams, 'state'),
  };
}

export function isOAuthCallbackUrl(url: string): boolean {
  if (!url) return false;
  return /(?:\?|#|&)(code|state)=/.test(url);
}

export function getCurrentAuthCallbackUrl(): string | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.href;
  }
  return null;
}
