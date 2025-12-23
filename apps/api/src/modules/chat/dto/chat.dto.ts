import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsIn } from 'class-validator';

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

  @ApiProperty({ description: 'Conversation history', type: [ChatMessageDto], required: false })
  @IsArray()
  @IsOptional()
  history?: ChatMessageDto[];
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Assistant response message' })
  message: string;

  @ApiProperty({ description: 'Tokens used', required: false })
  tokensUsed?: number;
}
