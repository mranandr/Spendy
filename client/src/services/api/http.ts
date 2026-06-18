import axios from 'axios';
import Constants from 'expo-constants';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../../lib/tokenStorage';

function resolveApiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  return (fromEnv || fromExtra || 'http://localhost:5050').replace(/\/$/, '');
}

export const API_BASE = resolveApiBase();

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access_token: string; refresh_token: string }>(`${API_BASE}/api/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .then(async (res) => {
        await saveTokens({
          accessToken: res.data.access_token,
          refreshToken: res.data.refresh_token,
        });
        return res.data.access_token;
      })
      .catch(async () => {
        await clearTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || original._retry || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    original._retry = true;
    const newToken = await refreshAccessToken();
    if (!newToken) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  }
);
