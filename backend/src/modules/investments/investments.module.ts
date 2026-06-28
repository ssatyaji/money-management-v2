import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { InvestmentsRepository } from './investments.repository';
import { MarketDataService } from './market-data.service';

@Module({
  controllers: [InvestmentsController],
  providers: [InvestmentsService, InvestmentsRepository, MarketDataService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
