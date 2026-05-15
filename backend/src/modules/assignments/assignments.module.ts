import { Module } from '@nestjs/common';

import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { ChildrenModule } from '../children/children.module';

@Module({
  imports: [ChildrenModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
