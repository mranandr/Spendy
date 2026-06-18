import type { Investment } from '../store/financeStore';

export type AiProvider = 'claude' | 'gemini';

export interface PortfolioSummary {
  totalValuePaise: number;
  totalInvestedPaise: number;
  totalGainsPaise: number;
  gainsPercent: number;
}

export interface ZerodhaSyncResponse {
  accessToken: string;
  userId?: string;
  holdings: Investment[];
  summary: PortfolioSummary;
}

export interface GrowwSyncResponse {
  accessToken?: string;
  holdings: Investment[];
  summary: PortfolioSummary;
  authMode?: 'api_key' | 'access_token';
}

export interface AiInsightsResponse {
  provider: AiProvider;
  model: string;
  text: string;
}
