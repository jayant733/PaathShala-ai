import api from './axios';

export interface ProviderHealth {
  status: 'healthy' | 'offline';
  latency: number | null;
  models?: string[];
}

export interface HealthStatus {
  gemini: ProviderHealth;
  ollama: ProviderHealth;
}

export const aiApi = {
  chat: async (message: string) => {
    const response = await api.post('/api/v1/ai/chat', { message });
    return response.data;
  },
  getHealth: async (): Promise<HealthStatus> => {
    const response = await api.get('/api/v1/ai/providers/health');
    return response.data;
  }
};
