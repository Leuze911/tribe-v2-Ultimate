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
        data: { message: 'Hello from assistant!' },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await chatService.sendMessage('Hello', []);

      expect(mockApi.post).toHaveBeenCalledWith('/chat/message', {
        message: 'Hello',
        history: [],
      });
      expect(result).toEqual({ message: 'Hello from assistant!' });
    });

    it('should include conversation history', async () => {
      const mockResponse = {
        data: { message: 'Response with context' },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const history = [
        { role: 'user' as const, content: 'Previous question' },
        { role: 'assistant' as const, content: 'Previous answer' },
      ];

      await chatService.sendMessage('New question', history);

      expect(mockApi.post).toHaveBeenCalledWith('/chat/message', {
        message: 'New question',
        history: history,
      });
    });

    it('should handle network errors', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      await expect(chatService.sendMessage('Test', [])).rejects.toThrow('Network error');
    });

    it('should handle API errors', async () => {
      mockApi.post.mockRejectedValue({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      await expect(chatService.sendMessage('Test', [])).rejects.toBeDefined();
    });
  });
});
