

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AddAssignmentDto } from '../specialist/dto/add-assignment.dto';
import { AddNoteDto } from '../specialist/dto/add-note.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CreateSpecialistDto, SetUserRoleDto } from './dto/create-specialist.dto';
import {
  CreateDiagnosticsQuestionDto,
  UpdateDiagnosticsQuestionDto,
} from './dto/diagnostics-question.dto';
import { publicChild, publicUser, daysSince } from '../../common/utils/mappers';
import { EXERCISE_TEMPLATES } from '../../common/constants/exercises';

const SPECIALIST_SALT_ROUNDS = 10;
const VALID_ROLES = ['parent', 'specialist', 'admin'] as const;

type Risk = 'low' | 'medium' | 'high';

const STAGE_NAMES = [
  'Tovushga reaksiya',
  'Ovozni tanish',
  'Tovushlar farqi',
  "So'zlar tanlash",
  "Jumlalar tushunish",
  'Nutq',
];

const DAY_LABELS = ['Du', 'Se', 'Chr', 'Pa', 'Ju', 'Sh', 'Ya'];
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

const GAMES = [
  { id: 'sound-find', title: 'Tovushlarni topish',  difficulty: 'Oson',     emoji: '🎯' },
  { id: 'direction',  title: "Tovush yo'nalishi",   difficulty: "O'rtacha", emoji: '🧭' },
  { id: 'word-pick',  title: "So'zni tanlash",      difficulty: "O'rtacha", emoji: '🧩' },
  { id: 'repeat',     title: 'Takrorlash',           difficulty: 'Qiyin',    emoji: '🔁' },
];

const DIAGNOSTICS_QUESTIONS = [
  "Bola o'z ismiga reaksiya bildiradimi?",
  "Bola atrofdagi tovushlarga e'tibor beradimi?",
  "Bola oddiy so'zlarni takrorlay oladimi?",
  'Bola ovoz manbasini qidiradimi?',
  'Bola musiqaga qiziqadimi?',
  'Bola sizning ohangingizni tushunadimi?',
  "Bola qisqa ko'rsatmalarga amal qiladimi?",
  'Bola boshqa bolalar bilan muloqot qilishga harakat qiladimi?',
];

const CATEGORIES = ['Reaksiya', 'Tanish', 'Tushunish', 'Nutq', 'Taqlid', 'Farq', 'Diqqat', 'Muloqot'];
const AGE_GROUPS = ['0–2 yosh', '1–3 yosh', '2–4 yosh', '3–5 yosh', '1–2 yosh', '3–5 yosh', '2–4 yosh', '3–6 yosh'];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard stats ────────────────────────────────────────────────────
  async stats() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [children, parents, specialists, weekCompletions, completionsByExerciseGroup] = await Promise.all([
      this.prisma.child.findMany(),
      this.prisma.user.count({ where: { role: 'parent' } }),
      this.prisma.user.count({ where: { role: 'specialist' } }),
      this.prisma.exerciseCompletion.findMany({
        where: { completedAt: { gte: sevenDaysAgo } },
        select: { childId: true, completedAt: true, exerciseId: true },
      }),
      this.prisma.exerciseCompletion.findMany({
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
    ]);

    const activeChildIds = new Set(weekCompletions.map((c) => c.childId));
    const weeklyActivityPct = children.length
      ? Math.round((activeChildIds.size / children.length) * 100)
      : 0;

    // Last 7 days bar chart
    const week: Array<{ day: string; value: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const value = weekCompletions.filter((c) => {
        const t = new Date(c.completedAt).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
      const idx = start.getDay() === 0 ? 6 : start.getDay() - 1;
      week.push({ day: DAY_LABELS[idx], value });
    }

    // Stage distribution
    const buckets = new Map<number, number>();
    for (const c of children) buckets.set(c.stageNumber, (buckets.get(c.stageNumber) ?? 0) + 1);
    const stages = STAGE_NAMES.map((name, i) => ({
      stage: i + 1,
      name,
      count: buckets.get(i + 1) ?? 0,
      pct: children.length ? Math.round(((buckets.get(i + 1) ?? 0) / children.length) * 100) : 0,
    }));

    // Recent completions
    const childById = new Map(children.map((c) => [c.id, c]));
    const recentCompletions = completionsByExerciseGroup.map((c) => {
      const child = childById.get(c.childId);
      const exercise = EXERCISE_TEMPLATES.find((e) => e.id === c.exerciseId);
      return {
        childId: c.childId,
        childName: child?.name ?? '—',
        exerciseTitle: exercise?.title ?? c.exerciseId,
        completedAt: c.completedAt.toISOString(),
      };
    });

    return {
      counts: {
        children: children.length,
        parents,
        specialists,
        activeThisWeek: activeChildIds.size,
        weeklyActivityPct,
      },
      week,
      stages,
      recentCompletions,
    };
  }

  // ── Admin user management ──────────────────────────────────────────────
  async createSpecialist(dto: CreateSpecialistDto) {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const title = dto.title?.trim() || 'Mutaxassis';

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Bu email allaqachon ishlatilmoqda');

    const passwordHash = await bcrypt.hash(dto.password, SPECIALIST_SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role: 'specialist',
        title,
        avatarLetter: fullName.charAt(0).toUpperCase() || 'M',
      },
    });
    return { user: publicUser(user) };
  }

  async setUserRole(userId: string, dto: SetUserRoleDto) {
    if (!VALID_ROLES.includes(dto.role)) {
      throw new BadRequestException(`Rol noto'g'ri: ${dto.role}`);
    }
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('Foydalanuvchi topilmadi');

    const title =
      dto.role === 'specialist'
        ? (dto.title?.trim() || target.title || 'Mutaxassis')
        : dto.role === 'admin'
          ? (dto.title?.trim() || 'Super admin')
          : null;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role, title },
    });
    return { user: publicUser(user) };
  }

  // ── Specialists ────────────────────────────────────────────────────────
  async specialists() {
    const specialists = await this.prisma.user.findMany({ where: { role: 'specialist' } });
    const grouped = await this.prisma.assignment.groupBy({
      by: ['specialistId'],
      _count: { specialistId: true },
    });
    const countById = new Map(grouped.map((g) => [g.specialistId, g._count.specialistId]));
    return {
      specialists: specialists.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        title: s.title ?? '—',
        avatarLetter: s.avatarLetter,
        avatarUrl: s.avatarUrl ?? null,
        assignments: countById.get(s.id) ?? 0,
        verified: s.verified,
      })),
    };
  }

  async setSpecialistVerified(specialistId: string, verified: boolean) {
    const target = await this.prisma.user.findUnique({ where: { id: specialistId } });
    if (!target) throw new NotFoundException('Mutaxassis topilmadi');
    if (target.role !== 'specialist') {
      throw new BadRequestException('Faqat mutaxassis tasdiqlanishi mumkin');
    }
    const user = await this.prisma.user.update({
      where: { id: specialistId },
      data: { verified },
    });
    return { user: publicUser(user) };
  }

  async deleteSpecialist(specialistId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: specialistId } });
    if (!target) throw new NotFoundException('Mutaxassis topilmadi');
    if (target.role !== 'specialist') {
      throw new BadRequestException("Faqat mutaxassisni o'chirish mumkin");
    }
    await this.prisma.user.delete({ where: { id: specialistId } });
    return { deleted: true };
  }

  // ── Parents ────────────────────────────────────────────────────────────
  async parents() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [parents, childrenAll, recentCompletions] = await Promise.all([
      this.prisma.user.findMany({ where: { role: 'parent' } }),
      this.prisma.child.findMany(),
      this.prisma.exerciseCompletion.findMany({
        where: { completedAt: { gte: sevenDaysAgo } },
        select: { childId: true },
      }),
    ]);

    const completionsByChild = new Map<string, number>();
    for (const c of recentCompletions) {
      completionsByChild.set(c.childId, (completionsByChild.get(c.childId) ?? 0) + 1);
    }
    const childrenByParent = new Map<string, typeof childrenAll>();
    for (const c of childrenAll) {
      const arr = childrenByParent.get(c.parentId) ?? [];
      arr.push(c);
      childrenByParent.set(c.parentId, arr);
    }

    return {
      parents: parents.map((p) => {
        const myChildren = childrenByParent.get(p.id) ?? [];
        const total = myChildren.reduce((s, c) => s + (completionsByChild.get(c.id) ?? 0), 0);
        return {
          id: p.id,
          fullName: p.fullName,
          email: p.email,
          avatarLetter: p.avatarLetter,
          avatarUrl: p.avatarUrl ?? null,
          childrenCount: myChildren.length,
          engagement: Math.min(100, total * 15),
        };
      }),
    };
  }

  // ── Children ───────────────────────────────────────────────────────────
  async children() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [children, users, assignments, recent] = await Promise.all([
      this.prisma.child.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.user.findMany(),
      this.prisma.assignment.findMany(),
      this.prisma.exerciseCompletion.findMany({
        where: { completedAt: { gte: sevenDaysAgo } },
        select: { childId: true },
      }),
    ]);

    const userById = new Map(users.map((u) => [u.id, u]));
    const firstAssignmentForChild = new Map<string, typeof assignments[number]>();
    for (const a of assignments) {
      if (!firstAssignmentForChild.has(a.childId)) firstAssignmentForChild.set(a.childId, a);
    }
    const activityCount = new Map<string, number>();
    for (const c of recent) activityCount.set(c.childId, (activityCount.get(c.childId) ?? 0) + 1);

    return {
      children: children.map((c) => {
        const pub = publicChild(c);
        const parent = userById.get(c.parentId);
        const assignment = firstAssignmentForChild.get(c.id);
        const specialist = assignment ? userById.get(assignment.specialistId) ?? null : null;
        const activity = Math.min(100, (activityCount.get(c.id) ?? 0) * 20);
        const risk: Risk =
          activity < 20 && pub.pct < 30 ? 'high' : activity < 50 || pub.pct < 40 ? 'medium' : 'low';
        return {
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          avatarUrl: c.avatarUrl ?? null,
          age: Math.max(
            0,
            Math.floor((Date.now() - new Date(c.dob).getTime()) / (365.25 * 24 * 3600 * 1000)),
          ),
          parentName: parent?.fullName ?? '—',
          specialistName: specialist?.fullName ?? '—',
          stage: c.stageNumber,
          stageName: c.stage,
          totalStages: c.totalStages,
          wordCount: c.wordCount,
          days: pub.days,
          progress: pub.pct,
          risk,
          activity,
        };
      }),
    };
  }

  async childDetail(id: string) {
    const child = await this.prisma.child.findUnique({ where: { id } });
    if (!child) throw new NotFoundException('Child not found');

    const [parent, assignmentsRaw, notesRaw, milestones, monthly, diagnostics, completionsRaw, chat] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { id: child.parentId } }),
        this.prisma.assignment.findMany({
          where: { childId: child.id },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.note.findMany({
          where: { childId: child.id },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.milestone.findMany({ where: { childId: child.id }, orderBy: { day: 'asc' } }),
        this.prisma.progressPoint.findMany({
          where: { childId: child.id },
          orderBy: { order: 'asc' },
          select: { month: true, value: true },
        }),
        this.prisma.diagnosticsSubmission.findMany({
          where: { childId: child.id },
          orderBy: { submittedAt: 'desc' },
        }),
        this.prisma.exerciseCompletion.findMany({
          where: { childId: child.id },
          orderBy: { completedAt: 'desc' },
          take: 20,
        }),
        this.prisma.chatMessage.findMany({
          where: { childId: child.id },
          orderBy: { createdAt: 'asc' },
          take: 20,
        }),
      ]);

    const firstAssignment = assignmentsRaw[0];
    const specialist = firstAssignment
      ? await this.prisma.user.findUnique({ where: { id: firstAssignment.specialistId } })
      : null;

    const authorIds = new Set([
      ...assignmentsRaw.map((a) => a.specialistId),
      ...notesRaw.map((n) => n.specialistId),
    ]);
    const authors = await this.prisma.user.findMany({ where: { id: { in: [...authorIds] } } });
    const authorById = new Map(authors.map((a) => [a.id, a]));

    const pub = publicChild(child);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCount = completionsRaw.filter((c) => new Date(c.completedAt).getTime() >= sevenDaysAgo)
      .length;
    const activity = Math.min(100, recentCount * 20);
    const risk: Risk =
      activity < 20 && pub.pct < 30 ? 'high' : activity < 50 || pub.pct < 40 ? 'medium' : 'low';

    return {
      child: { ...pub, risk },
      parent: parent
        ? {
            id: parent.id,
            fullName: parent.fullName,
            email: parent.email,
            avatarLetter: parent.avatarLetter,
            avatarUrl: parent.avatarUrl ?? null,
          }
        : null,
      specialist: specialist
        ? {
            id: specialist.id,
            fullName: specialist.fullName,
            email: specialist.email,
            title: specialist.title ?? '—',
            avatarLetter: specialist.avatarLetter,
            avatarUrl: specialist.avatarUrl ?? null,
          }
        : null,
      assignments: assignmentsRaw.map((a) => {
        const author = authorById.get(a.specialistId);
        return {
          id: a.id,
          title: a.title,
          done: a.done,
          createdAt: a.createdAt.toISOString(),
          authorName: author?.fullName ?? '—',
        };
      }),
      notes: notesRaw.map((n) => {
        const author = authorById.get(n.specialistId);
        return {
          id: n.id,
          text: n.text,
          createdAt: n.createdAt.toISOString(),
          authorName: author?.fullName ?? '—',
          authorRole: (author?.role as 'parent' | 'specialist' | 'admin') ?? 'specialist',
        };
      }),
      milestones: milestones.map((m) => ({
        id: m.id,
        day: m.day,
        title: m.title,
        done: m.done,
        current: m.current,
      })),
      monthly,
      diagnostics: diagnostics.map((d) => ({
        id: d.id,
        score: d.score,
        maxScore: d.maxScore,
        pct: d.pct,
        recommendations: (() => {
          try {
            return JSON.parse(d.recommendations) as string[];
          } catch {
            return [];
          }
        })(),
        submittedAt: d.submittedAt.toISOString(),
      })),
      completions: completionsRaw.map((c) => {
        const ex = EXERCISE_TEMPLATES.find((e) => e.id === c.exerciseId);
        return {
          exerciseId: c.exerciseId,
          date: c.date,
          completedAt: c.completedAt.toISOString(),
          title: ex?.title ?? c.exerciseId,
          emoji: ex?.emoji ?? '✅',
        };
      }),
      chat: chat.map((m) => ({
        id: m.id,
        from: m.from as 'ai' | 'user',
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async addAssignment(user: AuthenticatedUser, childId: string, dto: AddAssignmentDto) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) throw new NotFoundException('Child not found');
    const a = await this.prisma.assignment.create({
      data: { childId: child.id, specialistId: user.id, title: dto.title.trim() },
    });
    return {
      assignment: {
        id: a.id,
        childId: a.childId,
        specialistId: a.specialistId,
        title: a.title,
        createdAt: a.createdAt.toISOString(),
        done: a.done,
      },
    };
  }

  async addNote(user: AuthenticatedUser, childId: string, dto: AddNoteDto) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) throw new NotFoundException('Child not found');
    const n = await this.prisma.note.create({
      data: { childId: child.id, specialistId: user.id, text: dto.text.trim() },
    });
    return {
      note: {
        id: n.id,
        childId: n.childId,
        specialistId: n.specialistId,
        text: n.text,
        createdAt: n.createdAt.toISOString(),
      },
    };
  }

  // ── Assignments list (across all children) ─────────────────────────────
  async assignments() {
    const [list, users, children] = await Promise.all([
      this.prisma.assignment.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.user.findMany(),
      this.prisma.child.findMany(),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    const childById = new Map(children.map((c) => [c.id, c]));
    const now = Date.now();

    return {
      assignments: list.map((a) => {
        const ageMs = now - a.createdAt.getTime();
        const days = ageMs / (24 * 3600 * 1000);
        const status: 'completed' | 'in_progress' | 'overdue' | 'new' = a.done
          ? 'completed'
          : days > 5
            ? 'overdue'
            : days < 0.5
              ? 'new'
              : 'in_progress';
        const progress = a.done ? 100 : status === 'overdue' ? 30 : status === 'in_progress' ? 50 : 0;
        return {
          id: a.id,
          title: a.title,
          childName: childById.get(a.childId)?.name ?? '—',
          specialistName: userById.get(a.specialistId)?.fullName ?? '—',
          createdAt: a.createdAt.toISOString(),
          status,
          progress,
        };
      }),
    };
  }

  // ── Diagnostics (questions + recent results) ───────────────────────────
  async diagnostics() {
    // Boshlang'ich savollar bazada bo'lmasa — admin paneli kutib qolmasin
    // deb avtomatik seed qilamiz. Birinchi murojaat ham, qolganlari ham
    // bu xavfsiz: tranzaksiya emas, lekin idempotent — bo'sh bo'lsa to'ldiramiz.
    const existingCount = await this.prisma.diagnosticsQuestion.count();
    if (existingCount === 0) {
      await this.seedDefaultDiagnosticsQuestions();
    }

    const [questions, results, children] = await Promise.all([
      this.prisma.diagnosticsQuestion.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.diagnosticsSubmission.findMany({
        orderBy: { submittedAt: 'desc' },
        take: 20,
      }),
      this.prisma.child.findMany(),
    ]);
    const childById = new Map(children.map((c) => [c.id, c]));

    return {
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        category: q.category,
        ageGroup: q.ageGroup,
        weight: q.weight,
        active: q.active,
      })),
      results: results.map((r) => {
        let rec = '—';
        try {
          const arr = JSON.parse(r.recommendations) as string[];
          rec = arr[0] ?? '—';
        } catch {
          /* ignore */
        }
        return {
          id: r.id,
          childName: childById.get(r.childId)?.name ?? '—',
          score: r.score,
          maxScore: r.maxScore,
          pct: r.pct,
          recommendation: rec,
          submittedAt: r.submittedAt.toISOString(),
        };
      }),
    };
  }

  private async seedDefaultDiagnosticsQuestions() {
    await this.prisma.diagnosticsQuestion.createMany({
      data: DIAGNOSTICS_QUESTIONS.map((text, i) => ({
        text,
        category: CATEGORIES[i % CATEGORIES.length],
        ageGroup: AGE_GROUPS[i % AGE_GROUPS.length],
        weight: 2 + (i % 3),
        active: true,
        order: i,
      })),
    });
  }

  async createDiagnosticsQuestion(dto: CreateDiagnosticsQuestionDto) {
    const last = await this.prisma.diagnosticsQuestion.findFirst({ orderBy: { order: 'desc' } });
    const order = (last?.order ?? 0) + 1;
    const question = await this.prisma.diagnosticsQuestion.create({
      data: {
        text: dto.text.trim(),
        category: dto.category?.trim() || 'Umumiy',
        ageGroup: dto.ageGroup?.trim() || '0–5 yosh',
        weight: dto.weight ?? 2,
        active: dto.active ?? true,
        order,
      },
    });
    return { question };
  }

  async updateDiagnosticsQuestion(id: string, dto: UpdateDiagnosticsQuestionDto) {
    const existing = await this.prisma.diagnosticsQuestion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Savol topilmadi');
    const question = await this.prisma.diagnosticsQuestion.update({
      where: { id },
      data: {
        ...(dto.text !== undefined ? { text: dto.text.trim() } : {}),
        ...(dto.category !== undefined ? { category: dto.category.trim() || 'Umumiy' } : {}),
        ...(dto.ageGroup !== undefined ? { ageGroup: dto.ageGroup.trim() || '0–5 yosh' } : {}),
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
    return { question };
  }

  async deleteDiagnosticsQuestion(id: string) {
    const existing = await this.prisma.diagnosticsQuestion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Savol topilmadi');
    await this.prisma.diagnosticsQuestion.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Content (exercises + games) ────────────────────────────────────────
  async content() {
    const [exercises, completionsGroup, gameGroup] = await Promise.all([
      this.prisma.exercise.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.exerciseCompletion.groupBy({
        by: ['exerciseId'],
        _count: { exerciseId: true },
      }),
      this.prisma.gameScore.groupBy({
        by: ['game'],
        _count: { game: true },
      }),
    ]);
    const useByExercise = new Map(completionsGroup.map((g) => [g.exerciseId, g._count.exerciseId]));
    const playsByGame = new Map(gameGroup.map((g) => [g.game, g._count.game]));

    return {
      exercises: exercises.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type as 'Nutq' | 'Eshitish' | "O'yin",
        minutes: e.minutes,
        emoji: e.emoji,
        stage: e.stage,
        active: e.active,
        uses: useByExercise.get(e.id) ?? 0,
      })),
      games: GAMES.map((g) => ({ ...g, plays: playsByGame.get(g.id) ?? 0 })),
    };
  }

  // ── Exercise CRUD ───────────────────────────────────────────────────────
  async createExercise(input: {
    title: string;
    type: string;
    minutes?: number;
    emoji?: string;
    stage?: number;
    active?: boolean;
  }) {
    const last = await this.prisma.exercise.findFirst({ orderBy: { order: 'desc' } });
    const order = (last?.order ?? 0) + 1;
    const id = `ex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const exercise = await this.prisma.exercise.create({
      data: {
        id,
        title: input.title.trim(),
        type: input.type,
        minutes: input.minutes ?? 2,
        emoji: input.emoji?.trim() || '✨',
        stage: input.stage ?? 1,
        active: input.active ?? true,
        order,
      },
    });
    return { exercise };
  }

  async updateExercise(
    id: string,
    input: Partial<{
      title: string;
      type: string;
      minutes: number;
      emoji: string;
      stage: number;
      active: boolean;
    }>,
  ) {
    const ex = await this.prisma.exercise.findUnique({ where: { id } });
    if (!ex) throw new NotFoundException('Exercise not found');
    const exercise = await this.prisma.exercise.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.minutes !== undefined ? { minutes: input.minutes } : {}),
        ...(input.emoji !== undefined ? { emoji: input.emoji.trim() || '✨' } : {}),
        ...(input.stage !== undefined ? { stage: input.stage } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    return { exercise };
  }

  async deleteExercise(id: string) {
    const ex = await this.prisma.exercise.findUnique({ where: { id } });
    if (!ex) throw new NotFoundException('Exercise not found');
    // Tarixiy bog'liqliklar buzilmasligi uchun completions saqlanadi
    // (exerciseId — string FK emas, oddiy maydon).
    await this.prisma.exercise.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Analytics ──────────────────────────────────────────────────────────
  async analytics() {
    const [children, specialists, assignmentsGroup, notesGroup] = await Promise.all([
      this.prisma.child.findMany(),
      this.prisma.user.findMany({ where: { role: 'specialist' } }),
      this.prisma.assignment.groupBy({ by: ['specialistId'], _count: { specialistId: true } }),
      this.prisma.note.groupBy({ by: ['specialistId'], _count: { specialistId: true } }),
    ]);

    const totalWords = children.reduce((s, c) => s + c.wordCount, 0);
    const avgWords = children.length ? Math.round(totalWords / children.length) : 0;

    const ageBuckets = [
      { range: '0–2 yosh', min: 0, max: 2 },
      { range: '2–4 yosh', min: 2, max: 4 },
      { range: '4–6 yosh', min: 4, max: 6 },
      { range: '6+ yosh',  min: 6, max: 99 },
    ].map((g) => {
      const count = children.filter((c) => {
        const a = Math.max(0, Math.floor((Date.now() - new Date(c.dob).getTime()) / (365.25 * 24 * 3600 * 1000)));
        return a >= g.min && a < g.max;
      }).length;
      return {
        range: g.range,
        count,
        pct: children.length ? Math.round((count / children.length) * 100) : 0,
      };
    });

    const baseline = Math.max(2, Math.floor(children.length / 12));
    const growth = MONTHS.map((m, i) => ({ month: m, value: baseline * (i + 1) }));

    const assignmentsBy = new Map(assignmentsGroup.map((g) => [g.specialistId, g._count.specialistId]));
    const notesBy = new Map(notesGroup.map((g) => [g.specialistId, g._count.specialistId]));
    const topSpecialists = specialists
      .map((s) => ({
        name: s.fullName,
        assignments: assignmentsBy.get(s.id) ?? 0,
        notes: notesBy.get(s.id) ?? 0,
      }))
      .sort((a, b) => b.assignments + b.notes - (a.assignments + a.notes))
      .slice(0, 5);

    const stageBuckets = new Map<number, number>();
    for (const c of children) stageBuckets.set(c.stageNumber, (stageBuckets.get(c.stageNumber) ?? 0) + 1);
    const stages = STAGE_NAMES.map((name, i) => ({
      name,
      count: stageBuckets.get(i + 1) ?? 0,
      pct: children.length ? Math.round(((stageBuckets.get(i + 1) ?? 0) / children.length) * 100) : 0,
    }));

    return { avgWords, ageGroups: ageBuckets, growth, topSpecialists, stages };
  }

  // ── Notifications (broadcast) ──────────────────────────────────────────
  async sendNotification(user: AuthenticatedUser, dto: SendNotificationDto) {
    let recipients: { id: string }[] = [];
    if (dto.audience === 'user') {
      if (!dto.userId) throw new NotFoundException('userId required when audience=user');
      const target = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!target) throw new NotFoundException('Target user not found');
      recipients = [target];
    } else if (dto.audience === 'parents') {
      recipients = await this.prisma.user.findMany({ where: { role: 'parent' }, select: { id: true } });
    } else if (dto.audience === 'specialists') {
      recipients = await this.prisma.user.findMany({ where: { role: 'specialist' }, select: { id: true } });
    } else {
      recipients = await this.prisma.user.findMany({
        where: { role: { in: ['parent', 'specialist'] } },
        select: { id: true },
      });
    }

    if (recipients.length === 0) return { sent: 0 };

    await this.prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.id,
        authorId: user.id,
        title: dto.title.trim(),
        body: dto.body.trim(),
        link: dto.link?.trim() || null,
      })),
    });

    return { sent: recipients.length };
  }

  async listNotifications() {
    const [items, users] = await Promise.all([
      this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.user.findMany(),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    return {
      notifications: items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        link: n.link,
        recipientName: userById.get(n.userId)?.fullName ?? '—',
        recipientRole: (userById.get(n.userId)?.role as 'parent' | 'specialist' | 'admin') ?? 'parent',
        sentAt: n.createdAt.toISOString(),
        read: !!n.readAt,
      })),
    };
  }

  // unused but kept for parity with previous helper
  private _daysSince(d: Date) {
    return daysSince(d);
  }
}
