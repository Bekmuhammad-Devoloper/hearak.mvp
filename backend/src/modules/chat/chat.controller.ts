import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';

import { ChatService } from './chat.service';
import { PostChatDto } from './dto/post-chat.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query('childId') childId?: string) {
    return this.chat.list(user, childId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  post(@CurrentUser() user: AuthenticatedUser, @Body() dto: PostChatDto) {
    return this.chat.post(user, dto);
  }
}
