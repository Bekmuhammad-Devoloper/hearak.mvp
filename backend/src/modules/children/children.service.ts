import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Child } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { publicChild } from '../../common/utils/mappers';
import { MILESTONE_TEMPLATE } from '../../common/constants/milestones';

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser) {
    const children = await this.prisma.child.findMany({
      where: user.role === 'parent' ? { parentId: user.id } : {},
      orderBy: { createdAt: 'asc' },
    });
    return { children: children.map(publicChild) };
  }

  async create(user: AuthenticatedUser, dto: CreateChildDto) {
    if (user.role !== 'parent') {
      throw new ForbiddenException('Only parents can add their own child');
    }
    const child = await this.createChildWithMilestones(user.id, dto);
    return { child: publicChild(child) };
  }

  async getById(user: AuthenticatedUser, id: string) {
    const child = await this.ensureAccess(user, id);
    return { child: publicChild(child) };
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateChildDto) {
    await this.ensureAccess(user, id);
    const updated = await this.prisma.child.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.emoji !== undefined ? { emoji: dto.emoji.trim() || '🧒' } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
    });
    return { child: publicChild(updated) };
  }

  async ensureAccess(user: AuthenticatedUser, childId: string): Promise<Child> {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) throw new NotFoundException('Child not found');
    if (user.role === 'parent' && child.parentId !== user.id) {
      throw new ForbiddenException('Forbidden');
    }
    return child;
  }

  // Used by specialist module too — separate parentId so specialists can attach children to themselves.
  async createChildWithMilestones(
    parentId: string,
    dto: CreateChildDto,
  ): Promise<Child> {
    const child = await this.prisma.child.create({
      data: {
        parentId,
        name: dto.name.trim(),
        dob: new Date(dto.dob),
        implantDate: new Date(dto.implantDate),
        stage: 'Tovushlarga reaksiya bosqichi',
        stageNumber: 1,
        totalStages: 6,
        emoji: dto.emoji?.trim() || '🧒',
        wordCount: 0,
      },
    });

    await this.prisma.milestone.createMany({
      data: MILESTONE_TEMPLATE.map((m) => ({
        childId: child.id,
        day: m.day,
        title: m.title,
        done: false,
        current: m.day === 7,
      })),
    });

    return child;
  }
}
