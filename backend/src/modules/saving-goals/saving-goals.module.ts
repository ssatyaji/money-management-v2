import { Module } from '@nestjs/common';
import { SavingGoalsService } from './saving-goals.service';
import { SavingGoalsController } from './saving-goals.controller';
import { SavingGoalsRepository } from './saving-goals.repository';

@Module({
  controllers: [SavingGoalsController],
  providers: [SavingGoalsService, SavingGoalsRepository],
  exports: [SavingGoalsService],
})
export class SavingGoalsModule {}
