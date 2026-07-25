import { BankName } from '@prisma/client';

/**
 * Represents a single parsed transaction from a bank statement.
 */
export interface ParsedTransaction {
  /** Unique temp ID for frontend selection */
  tempId: string;
  /** Transaction date */
  date: Date;
  /** Transaction description from the statement */
  description: string;
  /** Transaction amount (always positive) */
  amount: number;
  /** Whether this is income, expense, or transfer */
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  /** Running balance after this transaction (if available) */
  balance?: number;
}

/**
 * Represents the full parsed result of a bank statement.
 */
export interface ParsedStatement {
  /** List of parsed transactions */
  transactions: ParsedTransaction[];
  /** Statement period date (if detected) */
  statementDate?: Date;
  /** Account number (if detected) */
  accountNumber?: string;
  /** Account holder name (if detected) */
  accountHolder?: string;
}

/**
 * Abstract base class for bank statement parsers.
 * Each bank has its own parser that extends this class.
 * Follows the Strategy Pattern for extensibility.
 */
export abstract class BaseStatementParser {
  /**
   * Parse the PDF buffer into structured transaction data.
   */
  abstract parse(text: string): Promise<ParsedStatement>;

  /**
   * Validate whether the text content looks like a valid statement
   * from this bank.
   */
  abstract validate(text: string): boolean;

  /**
   * Return the bank name enum for this parser.
   */
  abstract getBankName(): BankName;

  /**
   * Helper: Parse Indonesian-format number strings.
   * "1.234.567,89" → 1234567.89
   * "1,234,567.89" → 1234567.89
   * "1234567" → 1234567
   */
  protected parseAmount(amountStr: string): number {
    if (!amountStr) return 0;

    let cleaned = amountStr.replace(/\s/g, '').replace(/[()]/g, '');

    // Remove currency symbols
    cleaned = cleaned.replace(/(?:Rp\.?|IDR|Cr|Db|DR|CR)/gi, '').trim();

    // Indonesian format: "1.234.567,89" (dots as thousands, comma as decimal)
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    // US format: "1,234,567.89" (commas as thousands, dot as decimal)
    else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    }
    // Simple comma as decimal: "1234567,89"
    else if (/^\d+(,\d{1,2})$/.test(cleaned)) {
      cleaned = cleaned.replace(',', '.');
    }

    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : Math.abs(value);
  }

  /**
   * Helper: Parse date strings in various formats (constructs Date in UTC).
   */
  protected parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const cleaned = dateStr.trim();

    // DD/MM/YYYY
    let match = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match) {
      return new Date(
        Date.UTC(
          parseInt(match[3]),
          parseInt(match[2]) - 1,
          parseInt(match[1]),
        ),
      );
    }

    // DD/MM/YY
    match = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
    if (match) {
      const year = parseInt(match[3]) + 2000;
      return new Date(Date.UTC(year, parseInt(match[2]) - 1, parseInt(match[1])));
    }

    // DD MMM YYYY (e.g., "15 Jan 2026")
    const monthMap: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      mei: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      agu: 7,
      sep: 8,
      oct: 9,
      okt: 9,
      nov: 10,
      dec: 11,
      des: 11,
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11,
      januari: 0,
      februari: 1,
      maret: 2,
      juni: 5,
      juli: 6,
      agustus: 7,
      oktober: 9,
      desember: 11,
    };

    match = cleaned.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
    if (match) {
      const monthNum = monthMap[match[2].toLowerCase()];
      if (monthNum !== undefined) {
        return new Date(
          Date.UTC(parseInt(match[3]), monthNum, parseInt(match[1])),
        );
      }
    }

    // YYYY-MM-DD (ISO)
    match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return new Date(
        Date.UTC(
          parseInt(match[1]),
          parseInt(match[2]) - 1,
          parseInt(match[3]),
        ),
      );
    }

    return null;
  }

  /**
   * Helper: Generate a unique temp ID for a parsed transaction.
   */
  protected generateTempId(index: number): string {
    return `txn-${Date.now()}-${index}`;
  }
}
