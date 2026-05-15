import { Controller, Get, Param } from '@nestjs/common';

import { ProgressService } from './progress.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('children/:id')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('progress')
  getProgress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.progress.getProgress(user, id);
  }

  @Get('milestones')
  getMilestones(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.progress.getMilestones(user, id);
  }
}
