import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';

import { GamesService } from './games.service';
import { CreateGameScoreDto } from './dto/create-game-score.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('children/:id/game-scores')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.games.list(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateGameScoreDto,
  ) {
    return this.games.create(user, id, dto);
  }
}
