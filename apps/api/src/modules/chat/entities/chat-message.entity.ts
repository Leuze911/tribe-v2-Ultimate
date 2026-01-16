import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ChatSession } from './chat-session.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('chat_messages')
@Index(['sessionId'])
@Index(['createdAt'])
export class ChatMessage {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Session ID' })
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;

  @ApiProperty({ description: 'Message role', enum: MessageRole })
  @Column({
    type: 'enum',
    enum: MessageRole,
    enumName: 'message_role',
  })
  role: MessageRole;

  @ApiProperty({ description: 'Message content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'Tokens used for this message' })
  @Column({ name: 'tokens_used', type: 'int', nullable: true })
  tokensUsed: number | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
