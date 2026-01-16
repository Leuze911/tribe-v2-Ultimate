import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../users/entities/profile.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_sessions')
@Index(['userId'])
@Index(['updatedAt'])
export class ChatSession {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @ApiProperty({ description: 'Session title (auto-generated from first message)' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @ApiProperty({ description: 'Total messages in session' })
  @Column({ name: 'message_count', type: 'int', default: 0 })
  messageCount: number;

  @ApiProperty({ description: 'Total tokens used' })
  @Column({ name: 'total_tokens', type: 'int', default: 0 })
  totalTokens: number;

  @ApiProperty({ description: 'Session is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ChatMessage, (message) => message.session)
  messages: ChatMessage[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
