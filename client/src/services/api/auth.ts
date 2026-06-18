import { api } from './http';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferredCurrency: string;
  joinedDate: string;
  emailVerified: boolean;
}

export interface TokenBundle {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<TokenBundle> {
  const { data } = await api.post<TokenBundle>('/auth/register', { email, password, name });
  return data;
}

export async function login(email: string, password: string): Promise<TokenBundle> {
  const { data } = await api.post<TokenBundle>('/auth/login', { email, password });
  return data;
}

export async function fetchGoogleAuthUrl(redirectUri: string): Promise<{ url: string; state: string }> {
  const { data } = await api.get<{ url: string; state: string }>('/auth/google/url', {
    params: { redirect_uri: redirectUri },
  });
  return data;
}

export async function completeGoogleCallback(
  code: string,
  redirectUri: string,
  state: string
): Promise<TokenBundle> {
  const { data } = await api.post<TokenBundle>('/auth/google/callback', {
    code,
    redirect_uri: redirectUri,
    state,
  });
  return data;
}

export async function refreshSession(refreshToken: string): Promise<TokenBundle> {
  const { data } = await api.post<TokenBundle>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  return data;
}

export async function logout(refreshToken?: string | null): Promise<void> {
  await api.post('/auth/logout', { refresh_token: refreshToken ?? undefined });
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}
