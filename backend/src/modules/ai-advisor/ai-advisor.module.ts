import { Module } from '@nestjs/common';
import { AiAdvisorService } from './ai-advisor.service';
import { AiAdvisorController } from './ai-advisor.controller';
import { AiAdvisorCron } from './ai-advisor.cron';

@Module({
  controllers: [AiAdvisorController],
  providers: [AiAdvisorService, AiAdvisorCron],
  exports: [AiAdvisorService],
})
export class AiAdvisorModule {}
