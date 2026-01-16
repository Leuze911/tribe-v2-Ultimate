import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService, ChatMessage, ChatResponse, ChatSessionsResponse, ChatSessionDetail } from '../services/chat';

export interface UseChatOptions {
  sessionId?: string;
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(options?.sessionId);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (message: string): Promise<ChatResponse> => {
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await chatService.sendMessage(message, sessionId);

      // Update session ID if new session was created
      if (response.sessionId && !sessionId) {
        setSessionId(response.sessionId);
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Invalidate sessions query
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });

      return response;
    } catch (error) {
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, queryClient]);

  const loadSession = useCallback(async (id: string) => {
    try {
      const session = await chatService.getSession(id);
      setSessionId(id);
      setMessages(session.messages);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, []);

  const startNewSession = useCallback(() => {
    setSessionId(undefined);
    setMessages([]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    sendMessage,
    loadSession,
    startNewSession,
    clearMessages,
  };
}

export function useChatSessions() {
  return useQuery<ChatSessionsResponse>({
    queryKey: ['chatSessions'],
    queryFn: () => chatService.getSessions(),
  });
}

export function useChatSession(sessionId: string) {
  return useQuery<ChatSessionDetail>({
    queryKey: ['chatSession', sessionId],
    queryFn: () => chatService.getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => chatService.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
}
