import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenService } from '../children/children.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DAILY_EXERCISE_COUNT, EXERCISE_TEMPLATES } from '../../common/constants/exercises';
import { todayKey } from '../../common/utils/mappers';

type Pickable = {
  id: string;
  title: string;
  type: string;
  minutes: number;
  emoji: string;
};

/// Bolaning bugungi rehab kunini hisoblaydi (1-kun = implant qilingan kun).
/// Kelajakdagi implant sanasi yoki vaqt zonasi muammolarini hisobga olib,
/// natija doim >= 1 bo'ladi.
function calcRehabDay(implantDate: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const today = new Date();
  const t0 = Date.UTC(implantDate.getUTCFullYear(), implantDate.getUTCMonth(), implantDate.getUTCDate());
  const t1 = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const diff = Math.floor((t1 - t0) / MS_PER_DAY);
  return Math.max(1, diff + 1);
}

function pickDailyExercises<T extends Pickable>(childId: string, dateKey: string, pool0: T[]): T[] {
  // Deterministic shuffle: same child + same day always returns same set.
  const seed = [...childId, ...dateKey].reduce(
    (acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0,
    7,
  );
  const pool = [...pool0];
  const out: T[] = [];
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
export class ExercisesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  /** Birinchi ishga tushganda — agar Exercise jadvali bo'sh bo'lsa,
   * konstantadagi standart mashqlarni seed qiladi. */
  async onModuleInit() {
    const count = await this.prisma.exercise.count();
    if (count > 0) return;
    let order = 0;
    for (const t of EXERCISE_TEMPLATES) {
      order += 1;
      await this.prisma.exercise.create({
        data: {
          id: t.id,
          title: t.title,
          type: t.type,
          minutes: t.minutes,
          emoji: t.emoji,
          active: true,
          order,
        },
      });
    }
  }

  private async activePool() {
    const items = await this.prisma.exercise.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return items;
  }

  async listForChild(user: AuthenticatedUser, childId: string, dateParam?: string) {
    const child = await this.children.ensureAccess(user, childId);
    const dateKey = dateParam ?? todayKey();
    const pool = await this.activePool();

    // Bola implant qilingan kundan boshlab necha kun o'tgan: 1-kun = implant qilingan kun.
    const currentDay = calcRehabDay(child.implantDate);
    // Maksimal kun = admin yaratgan eng katta `day` qiymati (rehabilitatsiya davomiyligi).
    const maxDay = pool.reduce((m, e) => (e.day != null && e.day > m ? e.day : m), 0);

    // Bugungi kun uchun belgilangan mashqlar (admin biriktirgan).
    const scheduled = pool.filter((e) => e.day === currentDay);

    let items: typeof pool;
    if (scheduled.length > 0) {
      // Admin shu kunni tartibga solgan — faqat o'sha mashqlar ko'rsatiladi.
      items = scheduled;
    } else {
      // Hech narsa biriktirilmagan — eski deterministik tanlov logikasi (fond mashqlardan).
      const fallbackPool = pool.filter((e) => e.day == null);
      items = pickDailyExercises(child.id, dateKey, fallbackPool.length ? fallbackPool : pool);
    }

    const completions = await this.prisma.exerciseCompletion.findMany({
      where: { childId: child.id, date: dateKey },
      select: { exerciseId: true },
    });
    const done = new Set(completions.map((c) => c.exerciseId));

    return {
      date: dateKey,
      currentDay,
      totalDays: maxDay > 0 ? maxDay : null,
      exercises: items.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type as 'Nutq' | 'Eshitish' | "O'yin",
        minutes: e.minutes,
        emoji: e.emoji,
        day: e.day,
        completed: done.has(e.id),
      })),
    };
  }

  async complete(user: AuthenticatedUser, childId: string, exerciseId: string) {
    const child = await this.children.ensureAccess(user, childId);
    const ex = await this.prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!ex) throw new NotFoundException('Exercise not found');
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
