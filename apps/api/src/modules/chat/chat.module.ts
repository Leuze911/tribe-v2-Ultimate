import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Profile } from '../users/entities/profile.entity';
import { Location } from '../locations/entities/location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, Profile, Location]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
