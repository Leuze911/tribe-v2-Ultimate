import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsIn, IsUUID } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ description: 'Message role', enum: ['user', 'assistant'] })
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'User message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Session ID (optional, creates new if not provided)' })
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Conversation history (deprecated, use sessionId instead)', type: [ChatMessageDto] })
  @IsArray()
  @IsOptional()
  history?: ChatMessageDto[];
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Assistant response message' })
  message: string;

  @ApiPropertyOptional({ description: 'Session ID' })
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Tokens used' })
  tokensUsed?: number;
}

export class ChatSessionDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Session title' })
  title?: string;

  @ApiProperty({ description: 'Message count' })
  messageCount: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class ChatSessionDetailDto extends ChatSessionDto {
  @ApiProperty({ description: 'Messages', type: [ChatMessageDto] })
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
  }>;
}

export class ChatSessionsResponseDto {
  @ApiProperty({ description: 'Sessions', type: [ChatSessionDto] })
  sessions: ChatSessionDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}
