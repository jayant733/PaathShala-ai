import api from './axios';

export interface UserAIPreference {
  provider: string | null;
  model: string | null;
  mode: 'auto' | 'manual';
}

export const userApi = {
  getAiPreferences: async (): Promise<UserAIPreference> => {
    const response = await api.get('/api/v1/users/me/ai-preferences');
    return response.data;
  },
  
  updateAiPreferences: async (preferences: Partial<UserAIPreference>): Promise<UserAIPreference> => {
    const response = await api.put('/api/v1/users/me/ai-preferences', preferences);
    return response.data;
  }
};
