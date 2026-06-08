import { Module } from '@nestjs/common';
import { BankStatementsController } from './bank-statements.controller';
import { BankStatementsService } from './bank-statements.service';
import { BankStatementsRepository } from './bank-statements.repository';
import { ParserFactory } from './parsers/parser.factory';

@Module({
  controllers: [BankStatementsController],
  providers: [BankStatementsService, BankStatementsRepository, ParserFactory],
  exports: [BankStatementsService],
})
export class BankStatementsModule {}
