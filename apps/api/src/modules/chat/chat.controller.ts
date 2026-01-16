import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  ChatResponseDto,
  ChatSessionsResponseDto,
  ChatSessionDetailDto,
} from './dto/chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller({ path: 'chat', version: '1' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to the AI assistant' })
  @ApiResponse({
    status: 200,
    description: 'AI response',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendMessage(
    @CurrentUser('sub') userId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<ChatResponseDto> {
    return this.chatService.chat(
      userId,
      sendMessageDto.message,
      sendMessageDto.sessionId,
      sendMessageDto.history || [],
    );
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user chat sessions' })
  @ApiResponse({
    status: 200,
    description: 'List of chat sessions',
    type: ChatSessionsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(
    @CurrentUser('sub') userId: string,
  ): Promise<ChatSessionsResponseDto> {
    return this.chatService.getSessions(userId);
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific chat session with messages' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat session with messages',
    type: ChatSessionDetailDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ): Promise<ChatSessionDetailDto> {
    return this.chatService.getSession(userId, sessionId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 204, description: 'Session deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteSession(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ): Promise<void> {
    return this.chatService.deleteSession(userId, sessionId);
  }
}
