import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';

import { GameAssetsService } from './game-assets.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpsertAssetDto } from './dto/upsert-asset.dto';

/**
 * O'yin assetlari — admin yuklash uchun PUT/DELETE, oddiy foydalanuvchi
 * o'yin runtime'da GET orqali o'qiydi.
 */
@Controller('games')
export class GameAssetsController {
  constructor(private readonly assets: GameAssetsService) {}

  @Get(':game/assets')
  list(@Param('game') game: string) {
    return this.assets.listForGame(game);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':game/items/:itemKey')
  upsert(
    @Param('game') game: string,
    @Param('itemKey') itemKey: string,
    @Body() dto: UpsertAssetDto,
  ) {
    return this.assets.upsert(game, itemKey, dto.kind, dto.dataUrl);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':game/items/:itemKey/:kind')
  remove(
    @Param('game') game: string,
    @Param('itemKey') itemKey: string,
    @Param('kind') kind: 'image' | 'sound',
  ) {
    return this.assets.remove(game, itemKey, kind);
  }
}
