import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatService } from '../chat.service';

// Mock fetch
global.fetch = jest.fn();

describe('ChatService', () => {
  let service: ChatService;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    configService = module.get(ConfigService);
  });

  describe('chat', () => {
    it('should return demo response when API key not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.chat('user-123', 'Bonjour');

      expect(result.message).toContain('Bonjour');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call Anthropic API when key is configured', async () => {
      mockConfigService.get.mockReturnValue('sk-ant-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: 'Voici ma réponse' }],
            usage: { input_tokens: 100, output_tokens: 50 },
          }),
      });

      const result = await service.chat('user-123', 'Comment ajouter un POI?');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-api-key',
            'anthropic-version': '2023-06-01',
          }),
        }),
      );
      expect(result.message).toBe('Voici ma réponse');
      expect(result.tokensUsed).toBe(150);
    });

    it('should include conversation history in API call', async () => {
      mockConfigService.get.mockReturnValue('sk-ant-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: 'Réponse contextuelle' }],
            usage: { input_tokens: 100, output_tokens: 50 },
          }),
      });

      const history = [
        { role: 'user' as const, content: 'Bonjour' },
        { role: 'assistant' as const, content: 'Bonjour! Comment puis-je aider?' },
      ];

      await service.chat('user-123', 'Parle-moi des POI', history);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.messages).toHaveLength(3); // 2 history + 1 new
      expect(body.messages[0]).toEqual({ role: 'user', content: 'Bonjour' });
      expect(body.messages[1]).toEqual({
        role: 'assistant',
        content: 'Bonjour! Comment puis-je aider?',
      });
      expect(body.messages[2]).toEqual({
        role: 'user',
        content: 'Parle-moi des POI',
      });
    });

    it('should handle API errors gracefully', async () => {
      mockConfigService.get.mockReturnValue('sk-ant-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await service.chat('user-123', 'Test message');

      // Should fall back to demo response
      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should handle network errors gracefully', async () => {
      mockConfigService.get.mockReturnValue('sk-ant-api-key');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await service.chat('user-123', 'Test message');

      // Should fall back to demo response
      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should use claude-3-haiku model', async () => {
      mockConfigService.get.mockReturnValue('sk-ant-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: 'Response' }],
            usage: { input_tokens: 10, output_tokens: 10 },
          }),
      });

      await service.chat('user-123', 'Test');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.model).toBe('claude-3-haiku-20240307');
    });

    it('should include TRIBE system prompt', async () => {
      mockConfigService.get.mockReturnValue('sk-ant-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: 'Response' }],
            usage: { input_tokens: 10, output_tokens: 10 },
          }),
      });

      await service.chat('user-123', 'Test');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.system).toContain('TRIBE');
      expect(body.system).toContain('POI');
      expect(body.system).toContain('Sénégal');
    });
  });

  describe('getDemoResponse', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(undefined);
    });

    it('should return contextual response for greetings', async () => {
      const result = await service.chat('user-123', 'Bonjour!');
      expect(result.message).toContain('Bonjour');
      expect(result.message).toContain('assistant TRIBE');
    });

    it('should return contextual response for salut', async () => {
      const result = await service.chat('user-123', 'Salut!');
      expect(result.message).toContain('Bonjour');
    });

    it('should return contextual response for POI questions', async () => {
      const result = await service.chat('user-123', 'Comment ajouter un POI?');
      expect(result.message).toContain('POI');
      expect(result.message).toContain('bouton');
    });

    it('should return contextual response for lieu questions', async () => {
      const result = await service.chat('user-123', 'Comment ajouter un lieu?');
      expect(result.message).toContain('POI');
    });

    it('should return contextual response for points questions', async () => {
      const result = await service.chat('user-123', 'Comment gagner des points?');
      expect(result.message).toContain('points');
      expect(result.message).toContain('POI');
    });

    it('should return contextual response for rewards questions', async () => {
      const result = await service.chat(
        'user-123',
        'Quelles sont les récompenses?',
      );
      expect(result.message).toContain('points');
      expect(result.message).toContain('récompenses');
    });

    it('should return contextual response for level questions', async () => {
      const result = await service.chat('user-123', 'Quels sont les niveaux?');
      expect(result.message).toContain('Niveau');
      expect(result.message).toContain('Débutant');
    });

    it('should return generic response for unknown topics', async () => {
      const result = await service.chat(
        'user-123',
        'Parle-moi de la météo au Japon',
      );
      expect(result.message).toContain('aider');
      expect(result.message).toContain('POI');
    });

    it('should handle mixed case messages', async () => {
      const result = await service.chat('user-123', 'BONJOUR');
      expect(result.message).toContain('Bonjour');
    });
  });
});
