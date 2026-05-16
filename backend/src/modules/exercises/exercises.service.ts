import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenService } from '../children/children.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DAILY_EXERCISE_COUNT, EXERCISE_TEMPLATES } from '../../common/constants/exercises';
import { todayKey } from '../../common/utils/mappers';

function pickDailyExercises(childId: string, dateKey: string) {
  // Deterministic shuffle: same child + same day always returns same set.
  const seed = [...childId, ...dateKey].reduce(
    (acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0,
    7,
  );
  const pool = [...EXERCISE_TEMPLATES];
  const out: typeof pool = [];
  let s = seed;
  while (out.length < DAILY_EXERCISE_COUNT && pool.length) {
    s = (s * 9301 + 49297) % 233280;
    const idx = s % pool.length;
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

@Injectable()
export class ExercisesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  async listForChild(user: AuthenticatedUser, childId: string, dateParam?: string) {
    const child = await this.children.ensureAccess(user, childId);
    const dateKey = dateParam ?? todayKey();
    const items = pickDailyExercises(child.id, dateKey);

    const completions = await this.prisma.exerciseCompletion.findMany({
      where: { childId: child.id, date: dateKey },
      select: { exerciseId: true },
    });
    const done = new Set(completions.map((c) => c.exerciseId));

    return {
      date: dateKey,
      exercises: items.map((e) => ({ ...e, completed: done.has(e.id) })),
    };
  }

  async complete(user: AuthenticatedUser, childId: string, exerciseId: string) {
    const child = await this.children.ensureAccess(user, childId);
    if (!EXERCISE_TEMPLATES.some((e) => e.id === exerciseId)) {
      throw new NotFoundException('Exercise not found');
    }
    const dateKey = todayKey();
    await this.prisma.exerciseCompletion.upsert({
      where: {
        childId_exerciseId_date: {
          childId: child.id,
          exerciseId,
          date: dateKey,
        },
      },
      update: {},
      create: {
        childId: child.id,
        exerciseId,
        date: dateKey,
      },
    });
    return { completed: true };
  }

  async uncomplete(user: AuthenticatedUser, childId: string, exerciseId: string) {
    const child = await this.children.ensureAccess(user, childId);
    const dateKey = todayKey();
    await this.prisma.exerciseCompletion.deleteMany({
      where: { childId: child.id, exerciseId, date: dateKey },
    });
    return { completed: false };
  }
}
