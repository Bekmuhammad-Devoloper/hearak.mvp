import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser) {
    const items = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = items.filter((n) => !n.readAt).length;
    return {
      unread,
      notifications: items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        link: n.link,
        read: !!n.readAt,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  async markRead(user: AuthenticatedUser, id: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      throw new NotFoundException('Notification not found');
    }
    if (!existing.readAt) {
      await this.prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    }
    return { ok: true };
  }

  async markAllRead(user: AuthenticatedUser) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true, updated: result.count };
  }
}
