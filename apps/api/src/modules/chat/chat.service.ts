import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  tokensUsed?: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly configService: ConfigService) {}

  async chat(
    userId: string,
    message: string,
    conversationHistory: ChatMessage[] = [],
  ): Promise<ChatResponse> {
    const anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    // If no API key configured, use a simulated response for demo
    if (!anthropicApiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured, using demo mode');
      return this.getDemoResponse(message);
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          system: `Tu es l'assistant IA de TRIBE, une application de collecte de Points d'Intérêt (POI) au Sénégal.
Tu aides les utilisateurs à:
- Comprendre comment ajouter des POI
- Découvrir des lieux intéressants au Sénégal
- Gagner des points et des récompenses
- Naviguer dans l'application
Réponds en français de manière concise et amicale.`,
          messages: [
            ...conversationHistory.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content: message },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.content[0]?.text || 'Désolé, je n\'ai pas pu traiter votre message.';

      return {
        message: assistantMessage,
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
      };
    } catch (error) {
      this.logger.error('Error calling Claude API:', error);
      return this.getDemoResponse(message);
    }
  }

  private getDemoResponse(message: string): ChatResponse {
    const lowercaseMessage = message.toLowerCase();

    if (lowercaseMessage.includes('bonjour') || lowercaseMessage.includes('salut')) {
      return {
        message: 'Bonjour ! Je suis l\'assistant TRIBE. Comment puis-je vous aider aujourd\'hui ? 👋',
      };
    }

    if (lowercaseMessage.includes('poi') || lowercaseMessage.includes('lieu')) {
      return {
        message: `Pour ajouter un POI (Point d'Intérêt) :
1. Appuyez sur le bouton + vert sur la carte
2. Touchez la carte pour choisir l'emplacement
3. Remplissez les informations du lieu
4. Ajoutez une photo si possible
5. Validez pour gagner des points ! 🎯`,
      };
    }

    if (lowercaseMessage.includes('point') || lowercaseMessage.includes('récompense')) {
      return {
        message: `Vous gagnez des points en ajoutant des POI :
- POI basique : 10 points
- Avec photo : +5 points bonus
- POI validé : +10 points bonus

Les points vous permettent de monter de niveau et de débloquer des récompenses ! 🏆`,
      };
    }

    if (lowercaseMessage.includes('niveau') || lowercaseMessage.includes('level')) {
      return {
        message: `Les niveaux dans TRIBE :
🌱 Niveau 1 - Débutant (0 pts)
🗺️ Niveau 2 - Explorateur (100 pts)
🧭 Niveau 3 - Cartographe (300 pts)
⭐ Niveau 4 - Expert (600 pts)
👑 Niveau 5 - Maître (1000 pts)
🏆 Niveau 6 - Légende (2000 pts)`,
      };
    }

    return {
      message: `Je suis là pour vous aider ! Vous pouvez me poser des questions sur :
- Comment ajouter des POI
- Le système de points et récompenses
- Les niveaux et badges
- La navigation dans l'app

Que souhaitez-vous savoir ? 🤔`,
    };
  }
}
