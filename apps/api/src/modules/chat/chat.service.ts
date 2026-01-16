import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, MessageRole } from './entities/chat-message.entity';
import { Profile } from '../users/entities/profile.entity';
import { Location } from '../locations/entities/location.entity';
import {
  ChatResponseDto,
  ChatSessionDto,
  ChatSessionDetailDto,
  ChatSessionsResponseDto,
} from './dto/chat.dto';

interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async chat(
    userId: string,
    message: string,
    sessionId?: string,
    conversationHistory: ChatMessageInput[] = [],
  ): Promise<ChatResponseDto> {
    // Get or create session
    let session: ChatSession;
    if (sessionId) {
      const existingSession = await this.sessionRepository.findOne({
        where: { id: sessionId, userId },
      });
      if (!existingSession) {
        throw new NotFoundException('Chat session not found');
      }
      session = existingSession;
    } else {
      session = this.sessionRepository.create({
        userId,
        title: message.substring(0, 100),
      });
      session = await this.sessionRepository.save(session);
    }

    // Get history from database if using session
    let history: ChatMessageInput[] = conversationHistory;
    if (sessionId && conversationHistory.length === 0) {
      const dbMessages = await this.messageRepository.find({
        where: { sessionId },
        order: { createdAt: 'ASC' },
        take: 20, // Last 20 messages for context
      });
      history = dbMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    }

    // Save user message
    const userMessage = this.messageRepository.create({
      sessionId: session.id,
      role: MessageRole.USER,
      content: message,
    });
    await this.messageRepository.save(userMessage);

    // Get user context for better responses
    const userContext = await this.getUserContext(userId);

    // Get AI response
    const anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    let response: { message: string; tokensUsed?: number };

    if (!anthropicApiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured, using demo mode');
      response = this.getDemoResponse(message, userContext);
    } else {
      try {
        response = await this.callAnthropicAPI(message, history, userContext, anthropicApiKey);
      } catch (error) {
        this.logger.error('Error calling Claude API:', error);
        response = this.getDemoResponse(message, userContext);
      }
    }

    // Save assistant message
    const assistantMessage = this.messageRepository.create({
      sessionId: session.id,
      role: MessageRole.ASSISTANT,
      content: response.message,
      tokensUsed: response.tokensUsed || null,
    });
    await this.messageRepository.save(assistantMessage);

    // Update session stats
    await this.sessionRepository.update(session.id, {
      messageCount: () => 'message_count + 2',
      totalTokens: () => `total_tokens + ${response.tokensUsed || 0}`,
    });

    return {
      message: response.message,
      sessionId: session.id,
      tokensUsed: response.tokensUsed,
    };
  }

  async getSessions(userId: string): Promise<ChatSessionsResponseDto> {
    const [sessions, total] = await this.sessionRepository.findAndCount({
      where: { userId, isActive: true },
      order: { updatedAt: 'DESC' },
      take: 20,
    });

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title || 'Nouvelle conversation',
        messageCount: s.messageCount,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      total,
    };
  }

  async getSession(userId: string, sessionId: string): Promise<ChatSessionDetailDto> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    const messages = await this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });

    return {
      id: session.id,
      title: session.title || 'Nouvelle conversation',
      messageCount: session.messageCount,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    await this.sessionRepository.update(sessionId, { isActive: false });
  }

  private async getUserContext(userId: string): Promise<{
    level: number;
    points: number;
    poisCount: number;
    recentPois: string[];
  }> {
    const user = await this.profileRepository.findOne({ where: { id: userId } });
    const poisCount = await this.locationRepository.count({ where: { collectorId: userId } });
    const recentPois = await this.locationRepository.find({
      where: { collectorId: userId },
      order: { createdAt: 'DESC' },
      take: 3,
      select: ['name', 'category'],
    });

    return {
      level: user?.level || 1,
      points: user?.points || 0,
      poisCount,
      recentPois: recentPois.map((p) => `${p.name} (${p.category})`),
    };
  }

  private async callAnthropicAPI(
    message: string,
    history: ChatMessageInput[],
    userContext: { level: number; points: number; poisCount: number; recentPois: string[] },
    apiKey: string,
  ): Promise<{ message: string; tokensUsed?: number }> {
    const systemPrompt = `Tu es l'assistant IA de TRIBE, une application de collecte de Points d'Intérêt (POI) au Sénégal.

Contexte utilisateur actuel:
- Niveau: ${userContext.level}
- Points: ${userContext.points}
- POIs crées: ${userContext.poisCount}
${userContext.recentPois.length > 0 ? `- Derniers POIs: ${userContext.recentPois.join(', ')}` : ''}

Tu aides les utilisateurs à:
- Comprendre comment ajouter des POI (appuyer sur +, choisir emplacement, remplir infos, ajouter photo)
- Découvrir des lieux intéressants au Sénégal (restaurants, services, tourisme)
- Gagner des points et des récompenses (10pts base + bonus photo/validation)
- Naviguer dans l'application
- Comprendre le système de niveaux et badges

Réponds en français de manière concise et amicale. Utilise des emojis avec modération.
Si l'utilisateur demande des recommandations, base-toi sur sa progression actuelle.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...history.map((msg) => ({
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
  }

  private getDemoResponse(
    message: string,
    userContext: { level: number; points: number; poisCount: number; recentPois: string[] },
  ): { message: string } {
    const lowercaseMessage = message.toLowerCase();

    if (lowercaseMessage.includes('bonjour') || lowercaseMessage.includes('salut')) {
      return {
        message: `Bonjour ! Je suis l'assistant TRIBE. 👋

Vous êtes niveau ${userContext.level} avec ${userContext.points} points et ${userContext.poisCount} POIs créés.

Comment puis-je vous aider aujourd'hui ?`,
      };
    }

    if (lowercaseMessage.includes('poi') || lowercaseMessage.includes('lieu') || lowercaseMessage.includes('ajouter')) {
      return {
        message: `Pour ajouter un POI (Point d'Intérêt) :

1. 📍 Appuyez sur le bouton + vert sur la carte
2. 🗺️ Touchez la carte pour choisir l'emplacement
3. 📝 Remplissez les informations du lieu
4. 📸 Ajoutez une photo pour +5 points bonus
5. ✅ Validez pour gagner 10-25 points !

${userContext.poisCount === 0 ? "Vous n'avez pas encore créé de POI. C'est le moment de commencer ! 🚀" : `Bravo, vous avez déjà créé ${userContext.poisCount} POIs ! 🎉`}`,
      };
    }

    if (lowercaseMessage.includes('point') || lowercaseMessage.includes('récompense') || lowercaseMessage.includes('xp')) {
      return {
        message: `Système de points TRIBE :

📍 POI basique : 10 points
📸 Avec photo : +5 points bonus
✅ POI validé : +10 points bonus
📝 Description détaillée : +5 points

Votre progression :
- Points actuels : ${userContext.points}
- Niveau : ${userContext.level}
- POIs créés : ${userContext.poisCount}

Continuez à explorer pour débloquer des badges ! 🏆`,
      };
    }

    if (lowercaseMessage.includes('niveau') || lowercaseMessage.includes('level') || lowercaseMessage.includes('badge')) {
      return {
        message: `Les niveaux TRIBE :

🌱 Niveau 1 - Débutant (0 pts)
🗺️ Niveau 2 - Explorateur (100 pts)
🧭 Niveau 3 - Cartographe (250 pts)
⭐ Niveau 4 - Expert (500 pts)
👑 Niveau 5 - Maître (1000 pts)
🏆 Niveau 6 - Légende (2000 pts)

Vous êtes actuellement Niveau ${userContext.level} avec ${userContext.points} points.
${userContext.level < 6 ? `Plus que ${[100, 250, 500, 1000, 2000][userContext.level] - userContext.points} points pour le prochain niveau !` : 'Vous avez atteint le niveau maximum ! 🎉'}`,
      };
    }

    if (lowercaseMessage.includes('conseil') || lowercaseMessage.includes('aide') || lowercaseMessage.includes('astuce')) {
      const tips = [
        'Ajoutez des photos à vos POIs pour gagner 5 points bonus !',
        'Explorez différentes catégories pour débloquer des badges spéciaux.',
        'Les POIs avec description détaillée rapportent plus de points.',
        'Consultez le classement pour voir votre position !',
        'Les défis quotidiens offrent des bonus XP supplémentaires.',
      ];
      const randomTip = tips[Math.floor(Math.random() * tips.length)];

      return {
        message: `💡 Conseil du jour :

${randomTip}

Avec ${userContext.poisCount} POIs créés, vous êtes sur la bonne voie ! Que souhaitez-vous savoir d'autre ?`,
      };
    }

    if (lowercaseMessage.includes('dakar') || lowercaseMessage.includes('sénégal') || lowercaseMessage.includes('senegal')) {
      return {
        message: `Découvrir le Sénégal avec TRIBE ! 🇸🇳

Catégories populaires à explorer :
🍽️ Restaurants - Cuisine locale et internationale
🏪 Commerces - Marchés et boutiques
🏥 Services - Santé, banques, administrations
🎭 Culture - Musées, monuments, lieux historiques
🏖️ Tourisme - Plages, parcs, sites naturels

Votre zone préférée ? Je peux vous suggérer des types de lieux à ajouter !`,
      };
    }

    return {
      message: `Je suis là pour vous aider ! 🤔

Vous pouvez me demander :
• Comment ajouter des POI
• Le système de points et niveaux
• Des conseils pour progresser
• Des infos sur les badges

Vous êtes niveau ${userContext.level} avec ${userContext.points} points. Que souhaitez-vous savoir ?`,
    };
  }
}
