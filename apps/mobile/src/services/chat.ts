import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  tokensUsed?: number;
}

export const chatService = {
  async sendMessage(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    const response = await api.post('/chat/message', {
      message,
      history,
    });
    return response.data;
  },
};

export default chatService;
