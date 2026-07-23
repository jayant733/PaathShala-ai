import api from './axios';

export interface ConversationItem {
  id: string;
  title: string;
  last_message?: string;
  created_at: string;
}

export interface ConversationListResponse {
  conversations: ConversationItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  model?: string;
}

export interface ConversationMessagesResponse {
  messages: ChatMessage[];
}

export interface ConversationContextResponse {
  focus: string | null;
  topics: string[];
  memories: string[];
}

export const chatApi = {
  getConversations: async (): Promise<ConversationListResponse> => {
    const response = await api.get('/api/v1/chat/conversations');
    return response.data;
  },

  getConversationMessages: async (conversationId: string): Promise<ConversationMessagesResponse> => {
    const response = await api.get(`/api/v1/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  getConversationContext: async (conversationId: string): Promise<ConversationContextResponse> => {
    const response = await api.get(`/api/v1/chat/conversations/${conversationId}/context`);
    return response.data;
  }
};
