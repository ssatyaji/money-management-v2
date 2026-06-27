import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { InvestmentsRepository } from './investments.repository';

@Module({
  controllers: [InvestmentsController],
  providers: [InvestmentsService, InvestmentsRepository],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
