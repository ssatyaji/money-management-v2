import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from './alerts.service';

@Injectable()
export class AlertsCron {
  private readonly logger = new Logger(AlertsCron.name);
  constructor(
    private readonly alertsService: AlertsService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async run() {
    const users = await this.prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    });
    for (const u of users) {
      try {
        await this.alertsService.evaluateAlerts(u.id);
      } catch (e) {
        this.logger.error(`Alert evaluation failed for user ${u.id}`, e);
      }
    }
  }
}
