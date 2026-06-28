import { Module } from '@nestjs/common';
import { SavingGoalsService } from './saving-goals.service';
import { SavingGoalsController } from './saving-goals.controller';
import { SavingGoalsRepository } from './saving-goals.repository';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  controllers: [SavingGoalsController],
  providers: [SavingGoalsService, SavingGoalsRepository],
  exports: [SavingGoalsService],
})
export class SavingGoalsModule {}
