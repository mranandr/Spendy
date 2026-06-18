import { api } from './http';
import type { Investment } from '../../store/financeStore';
import type { AiInsightsResponse, AiProvider } from '../../types/portfolio';

export async function fetchPortfolioInsights(provider: AiProvider, holdings: Investment[]) {
  const { data } = await api.post<AiInsightsResponse>('/ai/insights', { provider, holdings });
  return data;
}
