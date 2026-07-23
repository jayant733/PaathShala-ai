import api from './axios';

export interface AgentChatRequest {
  message: string;
  conversation_id?: string;
  ai_mode?: string;
  provider?: string;
  model_name?: string;
}

export interface AgentChatResponse {
  agent: string;
  response: string;
  conversation_id: string;
}

export const agentApi = {
  chat: async (data: AgentChatRequest): Promise<AgentChatResponse> => {
    const response = await api.post('/api/v1/agent/chat', data);
    return response.data;
  },
  chatStream: async (
    data: AgentChatRequest, 
    onChunk: (chunk: string, isDone: boolean, error?: string, modelName?: string) => void,
    signal?: AbortSignal
  ) => {
    const token = localStorage.getItem('token');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/v1/agent/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
        signal // <-- pass signal here
      });
      
      if (!response.ok) {
        throw new Error('Failed to stream response');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                onChunk('', true, data.error);
                return;
              }
              onChunk(data.chunk, data.done, undefined, data.model_name);
            } catch (e) {
              console.error('Error parsing SSE data', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onChunk('', true, undefined, undefined); // Silently finish if aborted
        return;
      }
      onChunk('', true, err.message || 'Failed to connect to AI');
    }
  }
};
