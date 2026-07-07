import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsRepository } from './alerts.repository';
import { AlertsCron } from './alerts.cron';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, AlertsRepository, AlertsCron],
  exports: [AlertsService],
})
export class AlertsModule {}
