import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenService } from '../children/children.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateChildDto } from '../children/dto/create-child.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { AddAssignmentDto } from './dto/add-assignment.dto';
import { publicChild, daysSince } from '../../common/utils/mappers';

@Injectable()
export class SpecialistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  async stats() {
    const [patients, sevenDayCompletions, assignments] = await Promise.all([
      this.prisma.child.count(),
      this.prisma.exerciseCompletion.findMany({
        where: { completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { childId: true },
      }),
      this.prisma.assignment.count(),
    ]);

    const activeThisWeek = new Set(sevenDayCompletions.map((c) => c.childId)).size;
    return {
      patients,
      activeThisWeek,
      assignments,
    };
  }

  async patients() {
    const list = await this.prisma.child.findMany({ orderBy: { createdAt: 'asc' } });

    const lastByChild = new Map<string, Date>();
    if (list.length) {
      const completions = await this.prisma.exerciseCompletion.findMany({
        where: { childId: { in: list.map((c) => c.id) } },
        orderBy: { completedAt: 'desc' },
      });
      for (const c of completions) {
        if (!lastByChild.has(c.childId)) lastByChild.set(c.childId, c.completedAt);
      }
    }

    const patients = list.map((c) => ({
      id: c.id,
      name: c.name,
      age: Math.max(
        0,
        Math.floor((Date.now() - new Date(c.dob).getTime()) / (365.25 * 24 * 3600 * 1000)),
      ),
      implantMonths: Math.max(
        0,
        Math.floor((Date.now() - new Date(c.implantDate).getTime()) / (30 * 24 * 3600 * 1000)),
      ),
      lastSession: lastSessionLabel(lastByChild.get(c.id)),
      avatarLetter: c.name.charAt(0).toUpperCase(),
    }));

    return { patients };
  }

  async createPatient(user: AuthenticatedUser, dto: CreateChildDto) {
    const child = await this.children.createChildWithMilestones(user.id, dto);
    return { patient: publicChild(child) };
  }

  async patient(id: string) {
    const child = await this.prisma.child.findUnique({ where: { id } });
    if (!child) throw new NotFoundException('Patient not found');

    const [notes, assignments, milestones, monthly] = await Promise.all([
      this.prisma.note.findMany({
        where: { childId: child.id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assignment.findMany({
        where: { childId: child.id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.milestone.findMany({ where: { childId: child.id }, orderBy: { day: 'asc' } }),
      this.prisma.progressPoint.findMany({
        where: { childId: child.id },
        orderBy: { order: 'asc' },
        select: { month: true, value: true },
      }),
    ]);

    return {
      patient: publicChild(child),
      notes: notes.map((n) => ({ id: n.id, text: n.text, createdAt: n.createdAt.toISOString() })),
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        createdAt: a.createdAt.toISOString(),
        done: a.done,
      })),
      milestones: milestones.map((m) => ({
        id: m.id,
        day: m.day,
        title: m.title,
        done: m.done,
        current: m.current,
      })),
      monthly,
    };
  }

  async addNote(user: AuthenticatedUser, childId: string, dto: AddNoteDto) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) throw new NotFoundException('Patient not found');
    const note = await this.prisma.note.create({
      data: { childId: child.id, specialistId: user.id, text: dto.text.trim() },
    });
    return {
      note: {
        id: note.id,
        childId: note.childId,
        specialistId: note.specialistId,
        text: note.text,
        createdAt: note.createdAt.toISOString(),
      },
    };
  }

  async addAssignment(user: AuthenticatedUser, childId: string, dto: AddAssignmentDto) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) throw new NotFoundException('Patient not found');
    const assignment = await this.prisma.assignment.create({
      data: {
        childId: child.id,
        specialistId: user.id,
        title: dto.title.trim(),
        done: false,
      },
    });
    return {
      assignment: {
        id: assignment.id,
        childId: assignment.childId,
        specialistId: assignment.specialistId,
        title: assignment.title,
        createdAt: assignment.createdAt.toISOString(),
        done: assignment.done,
      },
    };
  }
}

function lastSessionLabel(date: Date | undefined): string {
  if (!date) return "Hali yo'q";
  const d = daysSince(date);
  if (d <= 0) return 'Bugun';
  if (d === 1) return 'Kecha';
  if (d < 7) return `${d} kun oldin`;
  if (d < 30) return `${Math.floor(d / 7)} hafta oldin`;
  return `${Math.floor(d / 30)} oy oldin`;
}
