import { Module } from '@nestjs/common';

import { GameAssetsController } from './game-assets.controller';
import { GameAssetsService } from './game-assets.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GameAssetsController],
  providers: [GameAssetsService],
})
export class GameAssetsModule {}
