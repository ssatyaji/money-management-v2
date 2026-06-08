import { Injectable, BadRequestException } from '@nestjs/common';
import { BankName } from '@prisma/client';
import { BaseStatementParser } from './base-statement.parser';
import { PermataParser } from './permata.parser';
import { JagoParser } from './jago.parser';
import { SeabankParser } from './seabank.parser';
import { BcaParser } from './bca.parser';

/**
 * Factory class for selecting the correct bank statement parser
 * based on the BankName enum. Follows the Factory Pattern.
 */
@Injectable()
export class ParserFactory {
  private readonly parsers: Map<BankName, BaseStatementParser>;

  constructor() {
    this.parsers = new Map<BankName, BaseStatementParser>([
      ['PERMATA', new PermataParser()],
      ['JAGO', new JagoParser()],
      ['SEABANK', new SeabankParser()],
      ['BCA', new BcaParser()],
    ]);
  }

  /**
   * Get the appropriate parser for a given bank name.
   * @throws BadRequestException if bank is not supported
   */
  getParser(bankName: BankName): BaseStatementParser {
    const parser = this.parsers.get(bankName);
    if (!parser) {
      throw new BadRequestException(
        `Parser untuk bank ${bankName} belum tersedia`,
      );
    }
    return parser;
  }

  /**
   * Auto-detect the bank from PDF text content.
   * Returns the parser if a match is found, null otherwise.
   */
  detectBank(text: string): BaseStatementParser | null {
    for (const parser of this.parsers.values()) {
      if (parser.validate(text)) {
        return parser;
      }
    }
    return null;
  }

  /**
   * Get list of supported bank names.
   */
  getSupportedBanks(): BankName[] {
    return Array.from(this.parsers.keys());
  }
}
