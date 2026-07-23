import api from './axios';

export const documentApi = {
  upload: async (file: File, conversationId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) {
      formData.append('conversation_id', conversationId);
    }
    
    const response = await api.post('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  ask: async (documentId: string, question: string) => {
    const response = await api.post(`/api/v1/documents/${documentId}/ask`, { question });
    return response.data;
  }
};
