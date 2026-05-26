import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateGameItemDto, UpdateGameItemDto } from './dto/game-item.dto';
import { ASSET_MAX_DATAURL, assertDataUrlSize } from '../../common/utils/data-url';

type Kind = 'image' | 'sound';

/** Boshlang'ich elementlar — bazada hech narsa bo'lmasa avtomatik seed qilinadi. */
const DEFAULT_ITEMS: Record<string, Array<{
  itemKey: string;
  label: string;
  emoji: string;
  onomatopoeia?: string;
  pitch?: number;
  rate?: number;
  frequency?: number;
}>> = {
  'sound-find': [
    { itemKey: 'dog',  label: 'It',      emoji: '🐶', onomatopoeia: 'vov vov vov',    pitch: 0.6, rate: 0.85, frequency: 380 },
    { itemKey: 'cat',  label: 'Mushuk',  emoji: '🐱', onomatopoeia: 'miyov miyov',    pitch: 1.6, rate: 0.7,  frequency: 700 },
    { itemKey: 'bird', label: 'Qush',    emoji: '🐦', onomatopoeia: 'chiy chiy chiy', pitch: 2.0, rate: 1.3,  frequency: 1200 },
    { itemKey: 'cow',  label: 'Sigir',   emoji: '🐮', onomatopoeia: 'mu-u-u',         pitch: 0.3, rate: 0.55, frequency: 200 },
    { itemKey: 'frog', label: 'Qurbaqa', emoji: '🐸', onomatopoeia: 'qurr qurr qurr', pitch: 0.5, rate: 0.7,  frequency: 540 },
    { itemKey: 'lion', label: 'Sher',    emoji: '🦁', onomatopoeia: 'rrrr arrr',      pitch: 0.2, rate: 0.5,  frequency: 150 },
  ],
  'word-pick': [
    { itemKey: 'olma',    label: 'Olma',    emoji: '🍎' },
    { itemKey: 'banan',   label: 'Banan',   emoji: '🍌' },
    { itemKey: 'quyosh',  label: 'Quyosh',  emoji: '☀️' },
    { itemKey: 'oy',      label: 'Oy',      emoji: '🌙' },
    { itemKey: 'mashina', label: 'Mashina', emoji: '🚗' },
    { itemKey: 'uy',      label: 'Uy',      emoji: '🏠' },
    { itemKey: 'gul',     label: 'Gul',     emoji: '🌸' },
    { itemKey: 'suv',     label: 'Suv',     emoji: '💧' },
  ],
};

@Injectable()
export class GameAssetsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Berilgan o'yin uchun barcha element meta + assetlarni qaytaradi.
   * Bazada element bo'lmasa, default ro'yxat avtomatik seed qilinadi —
   * eski xatti-harakat (hardcoded ro'yxat) bilan moslik saqlanadi.
   */
  async listForGame(game: string) {
    if (DEFAULT_ITEMS[game]) {
      const existing = await this.prisma.gameItem.count({ where: { game } });
      if (existing === 0) {
        await this.seedDefaults(game);
      }
    }

    const [items, assets] = await Promise.all([
      this.prisma.gameItem.findMany({
        where: { game },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.gameAsset.findMany({ where: { game } }),
    ]);

    const byItem: Record<string, { image?: string; sound?: string }> = {};
    for (const a of assets) {
      if (!byItem[a.itemKey]) byItem[a.itemKey] = {};
      if (a.kind === 'image') byItem[a.itemKey].image = a.dataUrl;
      else if (a.kind === 'sound') byItem[a.itemKey].sound = a.dataUrl;
    }

    return {
      game,
      // Eski kontrakt — frontend o'qiy oladi.
      items: byItem,
      // Yangi: element ro'yxati meta'lari bilan.
      itemList: items.map((it) => ({
        id: it.id,
        itemKey: it.itemKey,
        label: it.label,
        emoji: it.emoji,
        onomatopoeia: it.onomatopoeia,
        pitch: it.pitch,
        rate: it.rate,
        frequency: it.frequency,
        active: it.active,
        order: it.order,
      })),
    };
  }

  private async seedDefaults(game: string) {
    const defaults = DEFAULT_ITEMS[game];
    if (!defaults) return;
    await this.prisma.gameItem.createMany({
      data: defaults.map((d, i) => ({
        game,
        itemKey: d.itemKey,
        label: d.label,
        emoji: d.emoji,
        onomatopoeia: d.onomatopoeia ?? null,
        pitch: d.pitch ?? null,
        rate: d.rate ?? null,
        frequency: d.frequency ?? null,
        active: true,
        order: i,
      })),
    });
  }

  async createItem(game: string, dto: CreateGameItemDto) {
    const existing = await this.prisma.gameItem.findUnique({
      where: { game_itemKey: { game, itemKey: dto.itemKey } },
    });
    if (existing) {
      throw new ConflictException(`itemKey "${dto.itemKey}" bu o'yinda allaqachon mavjud`);
    }
    const last = await this.prisma.gameItem.findFirst({
      where: { game },
      orderBy: { order: 'desc' },
    });
    const order = dto.order ?? (last?.order ?? 0) + 1;
    const item = await this.prisma.gameItem.create({
      data: {
        game,
        itemKey: dto.itemKey,
        label: dto.label.trim(),
        emoji: dto.emoji?.trim() || '✨',
        onomatopoeia: dto.onomatopoeia?.trim() || null,
        pitch: dto.pitch ?? null,
        rate: dto.rate ?? null,
        frequency: dto.frequency ?? null,
        active: dto.active ?? true,
        order,
      },
    });
    return { item };
  }

  async updateItem(game: string, itemKey: string, dto: UpdateGameItemDto) {
    const existing = await this.prisma.gameItem.findUnique({
      where: { game_itemKey: { game, itemKey } },
    });
    if (!existing) throw new NotFoundException('Element topilmadi');
    const item = await this.prisma.gameItem.update({
      where: { game_itemKey: { game, itemKey } },
      data: {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.emoji !== undefined ? { emoji: dto.emoji.trim() || '✨' } : {}),
        ...(dto.onomatopoeia !== undefined
          ? { onomatopoeia: dto.onomatopoeia.trim() || null }
          : {}),
        ...(dto.pitch !== undefined ? { pitch: dto.pitch } : {}),
        ...(dto.rate !== undefined ? { rate: dto.rate } : {}),
        ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
    return { item };
  }

  async deleteItem(game: string, itemKey: string) {
    const existing = await this.prisma.gameItem.findUnique({
      where: { game_itemKey: { game, itemKey } },
    });
    if (!existing) throw new NotFoundException('Element topilmadi');
    // Element o'chirilganda — unga tegishli assetlarni ham tozalaymiz.
    await this.prisma.gameAsset.deleteMany({ where: { game, itemKey } });
    await this.prisma.gameItem.delete({
      where: { game_itemKey: { game, itemKey } },
    });
    return { deleted: true };
  }

  async upsert(game: string, itemKey: string, kind: Kind, dataUrl: string) {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      throw new BadRequestException('dataUrl must be a base64 data URL');
    }
    if (kind === 'image' && !dataUrl.startsWith('data:image/')) {
      throw new BadRequestException('image asset must be image/* data URL');
    }
    if (kind === 'sound' && !dataUrl.startsWith('data:audio/')) {
      throw new BadRequestException('sound asset must be audio/* data URL');
    }
    assertDataUrlSize(dataUrl, ASSET_MAX_DATAURL, `${kind} asseti`);
    const asset = await this.prisma.gameAsset.upsert({
      where: { game_itemKey_kind: { game, itemKey, kind } },
      update: { dataUrl },
      create: { game, itemKey, kind, dataUrl },
    });
    return { asset: { id: asset.id, game, itemKey, kind, hasData: true } };
  }

  async remove(game: string, itemKey: string, kind: Kind) {
    const existing = await this.prisma.gameAsset.findUnique({
      where: { game_itemKey_kind: { game, itemKey, kind } },
    });
    if (!existing) throw new NotFoundException('Asset not found');
    await this.prisma.gameAsset.delete({ where: { id: existing.id } });
    return { deleted: true };
  }
}
