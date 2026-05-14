import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';

import { SpeechChecksService } from './speech-checks.service';
import { CreateSpeechCheckDto } from './dto/create-speech-check.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('children/:id/speech-checks')
export class SpeechChecksController {
  constructor(private readonly speech: SpeechChecksService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.speech.list(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateSpeechCheckDto,
  ) {
    return this.speech.create(user, id, dto);
  }
}
