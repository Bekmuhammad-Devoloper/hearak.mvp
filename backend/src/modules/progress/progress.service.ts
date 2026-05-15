import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenService } from '../children/children.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { daysSince } from '../../common/utils/mappers';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  async getProgress(user: AuthenticatedUser, childId: string) {
    const child = await this.children.ensureAccess(user, childId);
    const monthly = await this.prisma.progressPoint.findMany({
      where: { childId: child.id },
      orderBy: { order: 'asc' },
      select: { month: true, value: true },
    });
    return {
      wordCount: child.wordCount,
      monthly,
      stage: child.stage,
      stageNumber: child.stageNumber,
      totalStages: child.totalStages,
      days: daysSince(child.implantDate),
    };
  }

  async getMilestones(user: AuthenticatedUser, childId: string) {
    const child = await this.children.ensureAccess(user, childId);
    const milestones = await this.prisma.milestone.findMany({
      where: { childId: child.id },
      orderBy: { day: 'asc' },
      select: { id: true, day: true, title: true, done: true, current: true },
    });
    return { milestones };
  }
}
