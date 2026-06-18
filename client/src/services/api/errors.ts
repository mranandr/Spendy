import axios from 'axios';
import { API_BASE } from './http';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; error?: string } | undefined;
    if (data?.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    if (data?.error) return data.error;
    if (error.response?.status === 401) return 'Session expired. Please sign in again.';
    if (error.response?.status === 429) return 'Too many requests. Please wait and try again.';
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      return `Cannot reach API at ${API_BASE}. Server running? Same Wi‑Fi as phone? Restart Expo with: npx expo start -c`;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Request failed';
}
