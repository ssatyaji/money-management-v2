import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(userId: string | null, action: string, details?: string, ipAddress?: string) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          action,
          details,
          ipAddress,
        },
      });
    } catch (error) {
      console.error('Failed to save activity log:', error);
    }
  }
}
