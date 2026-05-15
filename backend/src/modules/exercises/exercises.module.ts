import { Module } from '@nestjs/common';

import { ExercisesService } from './exercises.service';
import { ExercisesController } from './exercises.controller';
import { ChildrenModule } from '../children/children.module';

@Module({
  imports: [ChildrenModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
