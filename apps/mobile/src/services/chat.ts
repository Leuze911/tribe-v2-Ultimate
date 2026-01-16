import api from './api';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

export interface ChatResponse {
  message: string;
  sessionId?: string;
  tokensUsed?: number;
}

export interface ChatSession {
  id: string;
  title?: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
}

export interface ChatSessionsResponse {
  sessions: ChatSession[];
  total: number;
}

class ChatService {
  async sendMessage(
    message: string,
    sessionId?: string,
    history: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/chat/message', {
      message,
      sessionId,
      history: history.length > 0 ? history : undefined,
    });
    return response.data;
  }

  async getSessions(): Promise<ChatSessionsResponse> {
    const response = await api.get<ChatSessionsResponse>('/chat/sessions');
    return response.data;
  }

  async getSession(sessionId: string): Promise<ChatSessionDetail> {
    const response = await api.get<ChatSessionDetail>(`/chat/sessions/${sessionId}`);
    return response.data;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/chat/sessions/${sessionId}`);
  }
}

export const chatService = new ChatService();
export default chatService;
