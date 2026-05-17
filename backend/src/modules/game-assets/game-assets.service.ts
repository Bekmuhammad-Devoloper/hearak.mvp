import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

type Kind = 'image' | 'sound';

@Injectable()
export class GameAssetsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Berilgan o'yin uchun barcha assetlarni `{itemKey: {image, sound}}` shaklida. */
  async listForGame(game: string) {
    const rows = await this.prisma.gameAsset.findMany({ where: { game } });
    const byItem: Record<string, { image?: string; sound?: string }> = {};
    for (const r of rows) {
      if (!byItem[r.itemKey]) byItem[r.itemKey] = {};
      if (r.kind === 'image') byItem[r.itemKey].image = r.dataUrl;
      else if (r.kind === 'sound') byItem[r.itemKey].sound = r.dataUrl;
    }
    return { game, items: byItem };
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
