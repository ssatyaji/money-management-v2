import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AiAdvisorService } from './ai-advisor.service';

@Injectable()
export class AiAdvisorCron {
  private readonly logger = new Logger(AiAdvisorCron.name);
  constructor(
    private readonly svc: AiAdvisorService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron('0 0 * * 1') // Senin 00:00 UTC = 07:00 WIB
  async run() {
    const ago30 = new Date();
    ago30.setDate(ago30.getDate() - 30);
    const users = await this.prisma.user.findMany({
      where: { role: 'USER', updatedAt: { gte: ago30 } },
      select: { id: true },
    });
    for (const u of users) {
      try {
        await this.svc.generateInsightsForUser(u.id);
      } catch (e) {
        this.logger.error(`Insight generation failed for user ${u.id}`, e);
      }
    }
  }
}
