import { Module } from '@nestjs/common';

import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { ChildrenModule } from '../children/children.module';

@Module({
  imports: [ChildrenModule],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
