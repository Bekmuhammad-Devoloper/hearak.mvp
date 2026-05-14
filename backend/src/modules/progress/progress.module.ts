import { Module } from '@nestjs/common';

import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { ChildrenModule } from '../children/children.module';

@Module({
  imports: [ChildrenModule],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
