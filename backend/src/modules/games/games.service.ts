import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenService } from '../children/children.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateGameScoreDto, GameKindWire } from './dto/create-game-score.dto';

type GameKindDb = 'sound_find' | 'direction' | 'word_pick' | 'repeat';

// Frontend uses kebab-case (sound-find), DB stores snake_case (sound_find).
const wireToDb: Record<GameKindWire, GameKindDb> = {
  'sound-find': 'sound_find',
  direction: 'direction',
  'word-pick': 'word_pick',
  repeat: 'repeat',
};
const dbToWire: Record<GameKindDb, GameKindWire> = {
  sound_find: 'sound-find',
  direction: 'direction',
  word_pick: 'word-pick',
  repeat: 'repeat',
};

function toJson(s: {
  id: string;
  childId: string;
  game: string;
  score: number;
  total: number;
  createdAt: Date;
}) {
  return {
    id: s.id,
    childId: s.childId,
    game: dbToWire[s.game as GameKindDb] ?? s.game,
    score: s.score,
    total: s.total,
    createdAt: s.createdAt.toISOString(),
  };
}

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  async list(user: AuthenticatedUser, childId: string) {
    const child = await this.children.ensureAccess(user, childId);
    const list = await this.prisma.gameScore.findMany({
      where: { childId: child.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { scores: list.map(toJson) };
  }

  async create(user: AuthenticatedUser, childId: string, dto: CreateGameScoreDto) {
    const child = await this.children.ensureAccess(user, childId);
    const total = Math.max(1, Math.round(dto.total));
    const score = Math.max(0, Math.min(total, Math.round(dto.score)));
    const created = await this.prisma.gameScore.create({
      data: { childId: child.id, game: wireToDb[dto.game], score, total },
    });
    return { score: toJson(created) };
  }
}
