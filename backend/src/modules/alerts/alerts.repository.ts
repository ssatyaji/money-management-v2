import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByUser(userId: string) {
    return this.prisma.alert.findMany({
      where: { userId, isRead: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertAlert(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    metadata?: object;
    expiresAt: Date;
  }) {
    await this.prisma.alert.deleteMany({
      where: { userId: data.userId, type: data.type, isRead: false },
    });
    return this.prisma.alert.create({ data });
  }

  markAsRead(alertId: string, userId: string) {
    return this.prisma.alert.updateMany({
      where: { id: alertId, userId },
      data: { isRead: true },
    });
  }

  markAllAsRead(userId: string) {
    return this.prisma.alert.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  deleteExpired() {
    return this.prisma.alert.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
