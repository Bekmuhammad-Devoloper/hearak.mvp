import { Module } from '@nestjs/common';

import { RiskService } from './risk.service';
import { RiskController } from './risk.controller';
import { ChildrenModule } from '../children/children.module';

@Module({
  imports: [ChildrenModule],
  controllers: [RiskController],
  providers: [RiskService],
})
export class RiskModule {}
