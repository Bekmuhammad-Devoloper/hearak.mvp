import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenService } from '../children/children.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { daysSince } from '../../common/utils/mappers';

type Level = 'ok' | 'watch' | 'alert';

@Injectable()
export class RiskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  async getRisk(user: AuthenticatedUser, childId: string) {
    const child = await this.children.ensureAccess(user, childId);
    const days = daysSince(child.implantDate);
    const reasons: string[] = [];

    const expectedStage = Math.min(child.totalStages, Math.max(1, Math.floor(days / 90) + 1));
    if (child.stageNumber < expectedStage - 1) {
      reasons.push(
        `Hozirgi bosqich (${child.stageNumber}) implant muddati uchun kutilganidan past (${expectedStage})`,
      );
    }

    const latestDx = await this.prisma.diagnosticsSubmission.findFirst({
      where: { childId: child.id },
      orderBy: { submittedAt: 'desc' },
    });
    if (latestDx && latestDx.pct < 40) {
      reasons.push(`Oxirgi diagnostika natijasi past: ${latestDx.pct}%`);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await this.prisma.exerciseCompletion.count({
      where: { childId: child.id, completedAt: { gte: sevenDaysAgo } },
    });
    if (recentActivity === 0 && days > 14) {
      reasons.push("So'nggi 7 kunda mashqlar bajarilmagan");
    }

    let level: Level = 'ok';
    let recommendation = 'Hammasi yaxshi ketmoqda — kunlik mashqlarni davom eting.';
    if (reasons.length >= 2) {
      level = 'alert';
      recommendation = "Mutaxassis bilan tezroq bog'lanishni tavsiya etamiz.";
    } else if (reasons.length === 1) {
      level = 'watch';
      recommendation = "Bir-ikki haftada qo'shimcha mashqlar va kuzatuv kerak.";
    }

    return { level, reasons, recommendation };
  }
}
