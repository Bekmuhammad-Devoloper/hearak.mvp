import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenService } from '../children/children.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

function toJson(a: {
  id: string;
  childId: string;
  specialistId: string;
  title: string;
  createdAt: Date;
  done: boolean;
  doneAt: Date | null;
  parentFeedback: string | null;
}) {
  return {
    id: a.id,
    childId: a.childId,
    specialistId: a.specialistId,
    title: a.title,
    createdAt: a.createdAt.toISOString(),
    done: a.done,
    doneAt: a.doneAt ? a.doneAt.toISOString() : undefined,
    parentFeedback: a.parentFeedback ?? undefined,
  };
}

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  async listForChild(user: AuthenticatedUser, childId: string) {
    const child = await this.children.ensureAccess(user, childId);
    const list = await this.prisma.assignment.findMany({
      where: { childId: child.id },
      orderBy: { createdAt: 'desc' },
    });
    return { assignments: list.map(toJson) };
  }

  async update(user: AuthenticatedUser, assignmentId: string, dto: UpdateAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const child = await this.prisma.child.findUnique({ where: { id: assignment.childId } });
    if (!child) throw new NotFoundException('Child not found');
    if (user.role === 'parent' && child.parentId !== user.id) {
      throw new ForbiddenException('Forbidden');
    }

    const updated = await this.prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        ...(typeof dto.done === 'boolean'
          ? { done: dto.done, doneAt: dto.done ? new Date() : null }
          : {}),
        ...(typeof dto.parentFeedback === 'string'
          ? { parentFeedback: dto.parentFeedback.trim() || null }
          : {}),
      },
    });
    return { assignment: toJson(updated) };
  }
}
