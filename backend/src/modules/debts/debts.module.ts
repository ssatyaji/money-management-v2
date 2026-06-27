import { Module } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { DebtsRepository } from './debts.repository';

@Module({
  controllers: [DebtsController],
  providers: [DebtsService, DebtsRepository],
  exports: [DebtsService],
})
export class DebtsModule {}
