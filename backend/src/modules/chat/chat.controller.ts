import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { ChatService } from './chat.service';
import { PostChatDto } from './dto/post-chat.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  // ── Conversations ────────────────────────────────────────────────

  @Get('conversations')
  listConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('childId') childId?: string,
  ) {
    if (!childId) throw new BadRequestException('childId is required');
    return this.chat.listConversations(user, childId);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chat.createConversation(user, dto);
  }

  @Delete('conversations/:id')
  deleteConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.chat.deleteConversation(user, id);
  }

  // ── Messages ─────────────────────────────────────────────────────

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('childId') childId?: string,
    @Query('conversationId') conversationId?: string,
  ) {
    return this.chat.list(user, childId, conversationId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  post(@CurrentUser() user: AuthenticatedUser, @Body() dto: PostChatDto) {
    return this.chat.post(user, dto);
  }
}
