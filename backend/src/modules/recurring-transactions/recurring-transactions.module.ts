import { Module } from '@nestjs/common';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { RecurringTransactionsController } from './recurring-transactions.controller';
import { RecurringTransactionsRepository } from './recurring-transactions.repository';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [RecurringTransactionsController],
  providers: [RecurringTransactionsService, RecurringTransactionsRepository],
  exports: [RecurringTransactionsService],
})
export class RecurringTransactionsModule {}
