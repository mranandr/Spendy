import { create } from 'zustand';

/** Connection metadata only — tokens live encrypted in Supabase via FastAPI. */
interface BrokerState {
  zerodhaConnected: boolean;
  growwConnected: boolean;
  lastSyncedAt: string | null;
  setStatus: (zerodha: boolean, groww: boolean) => void;
  markSynced: () => void;
  reset: () => void;
}

export const useBrokerStore = create<BrokerState>((set) => ({
  zerodhaConnected: false,
  growwConnected: false,
  lastSyncedAt: null,
  setStatus: (zerodhaConnected, growwConnected) =>
    set({ zerodhaConnected, growwConnected }),
  markSynced: () => set({ lastSyncedAt: new Date().toISOString() }),
  reset: () => set({ zerodhaConnected: false, growwConnected: false, lastSyncedAt: null }),
}));
