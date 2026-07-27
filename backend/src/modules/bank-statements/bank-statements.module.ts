import { Module } from '@nestjs/common';
import { BankStatementsController } from './bank-statements.controller';
import { BankStatementsService } from './bank-statements.service';
import { BankStatementsRepository } from './bank-statements.repository';
import { ParserFactory } from './parsers/parser.factory';
import { AccountsModule } from '../accounts/accounts.module';
import { AiPdfFallbackParser } from './services/ai-pdf-fallback-parser.service';
import { AiTransactionDeduplicator } from './services/ai-transaction-deduplicator.service';

@Module({
  imports: [AccountsModule],
  controllers: [BankStatementsController],
  providers: [
    BankStatementsService,
    BankStatementsRepository,
    ParserFactory,
    AiPdfFallbackParser,
    AiTransactionDeduplicator,
  ],
  exports: [BankStatementsService],
})
export class BankStatementsModule {}
