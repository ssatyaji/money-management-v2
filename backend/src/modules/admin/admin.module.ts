import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogService } from './activity-log.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, ActivityLogService],
  exports: [AdminService, ActivityLogService],
})
export class AdminModule {}
