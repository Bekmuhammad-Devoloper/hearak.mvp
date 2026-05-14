import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { publicChild, publicUser } from '../../common/utils/mappers';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(user: AuthenticatedUser) {
    const stored = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!stored) throw new NotFoundException('User not found');

    const children =
      stored.role === 'parent'
        ? await this.prisma.child.findMany({
            where: { parentId: stored.id },
            orderBy: { createdAt: 'asc' },
          })
        : [];

    return {
      user: publicUser(stored),
      children: children.map(publicChild),
    };
  }

  async updateMe(user: AuthenticatedUser, dto: UpdateMeDto) {
    const stored = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!stored) throw new NotFoundException('User not found');

    const data: { fullName?: string; email?: string; avatarLetter?: string } = {};

    if (dto.fullName && dto.fullName.trim()) {
      const fullName = dto.fullName.trim();
      data.fullName = fullName;
      data.avatarLetter = fullName.charAt(0).toUpperCase();
    }

    if (dto.email && dto.email.trim()) {
      const email = dto.email.trim().toLowerCase();
      if (email !== stored.email) {
        const taken = await this.prisma.user.findUnique({ where: { email } });
        if (taken) throw new ConflictException('Email already in use');
        data.email = email;
      }
    }

    const updated = await this.prisma.user.update({ where: { id: stored.id }, data });
    return { user: publicUser(updated) };
  }
}
