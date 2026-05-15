import { Controller, Get, Param } from '@nestjs/common';

import { RiskService } from './risk.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('children/:id/risk')
export class RiskController {
  constructor(private readonly risk: RiskService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.risk.getRisk(user, id);
  }
}
