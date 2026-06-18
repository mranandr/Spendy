import { api } from './http';
import type { GrowwSyncResponse, ZerodhaSyncResponse } from '../../types/portfolio';

export async function getBrokerStatus() {
  const { data } = await api.get<{ zerodha: boolean; groww: boolean }>('/brokers/status');
  return data;
}

export async function getZerodhaLoginUrl() {
  const { data } = await api.get<{ loginUrl: string; redirectUrl: string }>('/zerodha/login-url');
  return data;
}

export async function syncZerodhaWithRequestToken(requestToken: string) {
  const { data } = await api.post<ZerodhaSyncResponse>('/zerodha/sync', { requestToken });
  return data;
}

export async function refreshZerodhaFromServer() {
  const { data } = await api.post<ZerodhaSyncResponse>('/brokers/zerodha/refresh');
  return data;
}

export async function syncGroww(accessToken?: string) {
  const body = accessToken ? { accessToken } : {};
  const { data } = await api.post<GrowwSyncResponse & { accessToken?: string }>('/groww/sync', body);
  return data;
}

export async function disconnectBroker(provider: 'zerodha' | 'groww') {
  await api.delete(`/brokers/${provider}`);
}
