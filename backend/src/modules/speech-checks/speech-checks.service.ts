import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenService } from '../children/children.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateSpeechCheckDto } from './dto/create-speech-check.dto';

function toJson(s: {
  id: string;
  childId: string;
  durationMs: number;
  avgLoudness: number;
  voiceActivityRatio: number;
  note: string | null;
  createdAt: Date;
}) {
  return {
    id: s.id,
    childId: s.childId,
    durationMs: s.durationMs,
    avgLoudness: s.avgLoudness,
    voiceActivityRatio: s.voiceActivityRatio,
    note: s.note ?? undefined,
    createdAt: s.createdAt.toISOString(),
  };
}

@Injectable()
export class SpeechChecksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  async list(user: AuthenticatedUser, childId: string) {
    const child = await this.children.ensureAccess(user, childId);
    const list = await this.prisma.speechCheck.findMany({
      where: { childId: child.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return { checks: list.map(toJson) };
  }

  async create(user: AuthenticatedUser, childId: string, dto: CreateSpeechCheckDto) {
    const child = await this.children.ensureAccess(user, childId);
    const check = await this.prisma.speechCheck.create({
      data: {
        childId: child.id,
        durationMs: Math.max(0, Math.round(dto.durationMs)),
        avgLoudness: Math.max(0, Math.min(1, dto.avgLoudness)),
        voiceActivityRatio: Math.max(0, Math.min(1, dto.voiceActivityRatio)),
        note: dto.note?.trim() || null,
      },
    });
    return { check: toJson(check) };
  }
}
