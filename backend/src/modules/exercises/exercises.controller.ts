import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { ExercisesService } from './exercises.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('children/:id/exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('date') date?: string,
  ) {
    return this.exercises.listForChild(user, id, date);
  }

  @Post(':exerciseId/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.exercises.complete(user, id, exerciseId);
  }

  @Delete(':exerciseId/complete')
  uncomplete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.exercises.uncomplete(user, id, exerciseId);
  }
}
