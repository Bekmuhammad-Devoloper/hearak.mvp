import { Module } from '@nestjs/common';

import { SpeechChecksService } from './speech-checks.service';
import { SpeechChecksController } from './speech-checks.controller';
import { ChildrenModule } from '../children/children.module';

@Module({
  imports: [ChildrenModule],
  controllers: [SpeechChecksController],
  providers: [SpeechChecksService],
})
export class SpeechChecksModule {}
