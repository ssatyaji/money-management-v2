import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { BudgetsRepository } from './budgets.repository';

@Module({
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsRepository],
  exports: [BudgetsService],
})
export class BudgetsModule {}
