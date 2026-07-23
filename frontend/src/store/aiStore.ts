import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { aiApi } from '../api/ai.api';
import type { HealthStatus } from '../api/ai.api';

type AIMode = 'auto' | 'gemini' | 'ollama';

interface AIState {
  mode: AIMode;
  provider: string;
  model: string;
  health: HealthStatus | null;
  setMode: (mode: AIMode) => void;
  setProviderAndModel: (provider: string, model: string) => void;
  fetchHealth: () => Promise<void>;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      health: null,
      setMode: (mode) => set({ mode }),
      setProviderAndModel: (provider, model) => set({ provider, model }),
      fetchHealth: async () => {
        // Simple caching: if we already have it, don't refetch on every call
        // (You could add a timestamp for TTL if needed)
        if (get().health !== null) return;
        try {
          const healthData = await aiApi.getHealth();
          set({ health: healthData });
        } catch (e) {
          console.error("Failed to fetch AI health", e);
        }
      }
    }),
    {
      name: 'ai-preferences',
      partialize: (state) => ({ mode: state.mode, provider: state.provider, model: state.model }), // Do NOT persist health
    }
  )
);
