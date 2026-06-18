import { api } from './http';

export async function getHealth() {
  const { data } = await api.get<{
    ok: boolean;
    zerodha: boolean;
    ai: boolean;
    database: boolean;
    auth: boolean;
    rateLimit: boolean;
  }>('/health');
  return data;
}
