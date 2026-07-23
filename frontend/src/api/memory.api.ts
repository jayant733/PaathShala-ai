import api from './axios';

export interface Memory {
  id: string;
  topic: string;
  event_type: string;
  created_at: string;
}

export const memoryApi = {
  getMemories: async (): Promise<Memory[]> => {
    const response = await api.get('/api/v1/memory');
    return response.data;
  }
};
