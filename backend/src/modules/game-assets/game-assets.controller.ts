import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { GameAssetsService } from './game-assets.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpsertAssetDto } from './dto/upsert-asset.dto';
import { CreateGameItemDto, UpdateGameItemDto } from './dto/game-item.dto';

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

  // ── Element meta CRUD (admin only) ────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post(':game/items-meta')
  @HttpCode(HttpStatus.CREATED)
  createItem(@Param('game') game: string, @Body() dto: CreateGameItemDto) {
    return this.assets.createItem(game, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':game/items-meta/:itemKey')
  updateItem(
    @Param('game') game: string,
    @Param('itemKey') itemKey: string,
    @Body() dto: UpdateGameItemDto,
  ) {
    return this.assets.updateItem(game, itemKey, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':game/items-meta/:itemKey')
  deleteItem(@Param('game') game: string, @Param('itemKey') itemKey: string) {
    return this.assets.deleteItem(game, itemKey);
  }
}
