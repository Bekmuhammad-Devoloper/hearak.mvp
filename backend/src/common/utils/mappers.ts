import type { Child, User } from '@prisma/client';
import type { Role } from '../types/role';

export function daysSince(date: Date | string): number {
  const t = new Date(date).getTime();
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
}

export function publicUser(
  user: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'title' | 'avatarLetter'> & {
    avatarUrl?: string | null;
  },
) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role as Role,
    title: user.title ?? undefined,
    avatarLetter: user.avatarLetter,
    avatarUrl: user.avatarUrl ?? null,
  };
}

export function publicChild(child: Child) {
  const days = daysSince(child.implantDate);
  const pct = Math.round((child.stageNumber / child.totalStages) * 100);
  return {
    id: child.id,
    parentId: child.parentId,
    name: child.name,
    dob: child.dob.toISOString().slice(0, 10),
    implantDate: child.implantDate.toISOString().slice(0, 10),
    stage: child.stage,
    stageNumber: child.stageNumber,
    totalStages: child.totalStages,
    emoji: child.emoji,
    wordCount: child.wordCount,
    createdAt: child.createdAt.toISOString(),
    days,
    pct,
  };
}

export function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
