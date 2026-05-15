import { Module } from '@nestjs/common';

import { SpecialistService } from './specialist.service';
import { SpecialistController } from './specialist.controller';
import { ChildrenModule } from '../children/children.module';

@Module({
  imports: [ChildrenModule],
  controllers: [SpecialistController],
  providers: [SpecialistService],
})
export class SpecialistModule {}
