// Mock the entire api module before importing anything
jest.mock('../src/services/api', () => {
  return {
    __esModule: true,
    default: {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
  };
});

// Now import the service and mocked module
import api from '../src/services/api';
import { chatService } from '../src/services/chat';

const mockApi = api as jest.Mocked<typeof api>;

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message to API', async () => {
      const mockResponse = {
        data: { message: 'Hello from assistant!', sessionId: 'session-123' },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await chatService.sendMessage('Hello');

      expect(mockApi.post).toHaveBeenCalledWith('/chat/message', {
        message: 'Hello',
        sessionId: undefined,
        history: undefined,
      });
      expect(result).toEqual({ message: 'Hello from assistant!', sessionId: 'session-123' });
    });

    it('should include sessionId when provided', async () => {
      const mockResponse = {
        data: { message: 'Response with session', sessionId: 'session-123' },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      await chatService.sendMessage('New question', 'session-123');

      expect(mockApi.post).toHaveBeenCalledWith('/chat/message', {
        message: 'New question',
        sessionId: 'session-123',
        history: undefined,
      });
    });

    it('should include conversation history when provided', async () => {
      const mockResponse = {
        data: { message: 'Response with context' },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const history = [
        { role: 'user' as const, content: 'Previous question' },
        { role: 'assistant' as const, content: 'Previous answer' },
      ];

      await chatService.sendMessage('New question', undefined, history);

      expect(mockApi.post).toHaveBeenCalledWith('/chat/message', {
        message: 'New question',
        sessionId: undefined,
        history: history,
      });
    });

    it('should handle network errors', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      await expect(chatService.sendMessage('Test')).rejects.toThrow('Network error');
    });

    it('should handle API errors', async () => {
      mockApi.post.mockRejectedValue({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      await expect(chatService.sendMessage('Test')).rejects.toBeDefined();
    });
  });

  describe('getSessions', () => {
    it('should fetch chat sessions', async () => {
      const mockResponse = {
        data: {
          sessions: [
            { id: '1', title: 'Test session', messageCount: 2, createdAt: new Date(), updatedAt: new Date() },
          ],
          total: 1,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await chatService.getSessions();

      expect(mockApi.get).toHaveBeenCalledWith('/chat/sessions');
      expect(result.sessions).toHaveLength(1);
    });
  });

  describe('getSession', () => {
    it('should fetch session details with messages', async () => {
      const mockResponse = {
        data: {
          id: 'session-123',
          title: 'Test session',
          messageCount: 2,
          messages: [
            { id: '1', role: 'user', content: 'Hello' },
            { id: '2', role: 'assistant', content: 'Hi there!' },
          ],
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await chatService.getSession('session-123');

      expect(mockApi.get).toHaveBeenCalledWith('/chat/sessions/session-123');
      expect(result.messages).toHaveLength(2);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      mockApi.delete.mockResolvedValue({});

      await chatService.deleteSession('session-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/chat/sessions/session-123');
    });
  });
});
