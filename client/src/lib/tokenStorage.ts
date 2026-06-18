import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'spendy_access_token';
const REFRESH_KEY = 'spendy_refresh_token';

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(key, value);
}

async function remove(key: string): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(key);
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function getAccessToken(): Promise<string | null> {
  return read(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return read(REFRESH_KEY);
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await write(ACCESS_KEY, tokens.accessToken);
  await write(REFRESH_KEY, tokens.refreshToken);
}

export async function clearTokens(): Promise<void> {
  await remove(ACCESS_KEY);
  await remove(REFRESH_KEY);
}
