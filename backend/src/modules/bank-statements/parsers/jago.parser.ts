/* eslint-disable @typescript-eslint/require-await */
import { BankName } from '@prisma/client';
import {
  BaseStatementParser,
  ParsedStatement,
  ParsedTransaction,
} from './base-statement.parser';

/**
 * Parser for Bank Jago e-statements.
 *
 * Typical Jago statement format (digital bank):
 * - Modern PDF layout
 * - Transaction list with date, description, amount, type
 * - Date format: DD MMM YYYY or DD/MM/YYYY
 * - Amount format: Rp 1.234.567
 */
export class JagoParser extends BaseStatementParser {
  getBankName(): BankName {
    return 'JAGO';
  }

  validate(text: string): boolean {
    const keywords = ['bank jago', 'pt bank jago', 'jago'];
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw));
  }

  async parse(text: string): Promise<ParsedStatement> {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const transactions: ParsedTransaction[] = [];
    let statementDate: Date | undefined;
    let accountNumber: string | undefined;

    // Extract account number
    const accMatch = text.match(
      /(?:nomor\s*(?:rekening|akun)|account)[:\s]*(\d[\d\s\-.]+\d)/i,
    );
    if (accMatch) {
      accountNumber = accMatch[1].replace(/[\s\-.]/g, '');
    }

    // Extract statement period
    const periodMatch = text.match(
      /(?:periode|period|bulan)[:\s]*(.+?)(?:\n|$)/i,
    );
    if (periodMatch) {
      const parsed = this.parseDate(
        periodMatch[1]
          .trim()
          .split(/\s*[-–]\s*/)
          .pop() || '',
      );
      if (parsed) statementDate = parsed;
    }

    // Parse transactions
    // Jago typically shows: Date  Description  -/+ Amount
    let txnIndex = 0;

    // Pattern 1: "DD MMM YYYY  Description  -Rp 1.234.567" or "+Rp 1.234.567"
    const pattern1 =
      /(\d{1,2}\s+\w+\s+\d{4})\s+(.+?)\s+([+-]?)\s*(?:Rp\.?\s*)?([\d.,]+)/i;
    // Pattern 2: "DD/MM/YYYY  Description  Amount  Type"
    const pattern2 =
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([\d.,]+)\s*(masuk|keluar|kredit|debit|cr|db)/i;

    for (const line of lines) {
      let match = line.match(pattern1);
      if (match) {
        const date = this.parseDate(match[1]);
        if (!date) continue;

        const description = match[2].trim();
        const sign = match[3];
        const amount = this.parseAmount(match[4]);

        if (amount <= 0) continue;

        transactions.push({
          tempId: this.generateTempId(txnIndex++),
          date,
          description,
          amount,
          type: sign === '-' ? 'EXPENSE' : 'INCOME',
        });
        continue;
      }

      match = line.match(pattern2);
      if (match) {
        const date = this.parseDate(match[1]);
        if (!date) continue;

        const description = match[2].trim();
        const amount = this.parseAmount(match[3]);
        const typeIndicator = match[4].toLowerCase();

        if (amount <= 0) continue;

        const isIncome = ['masuk', 'kredit', 'cr'].includes(typeIndicator);

        transactions.push({
          tempId: this.generateTempId(txnIndex++),
          date,
          description,
          amount,
          type: isIncome ? 'INCOME' : 'EXPENSE',
        });
      }
    }

    // Fallback: generic date + amount parsing
    if (transactions.length === 0) {
      this.parseFallback(lines, transactions);
    }

    return { transactions, statementDate, accountNumber };
  }

  private parseFallback(
    lines: string[],
    transactions: ParsedTransaction[],
  ): void {
    let txnIndex = 0;
    const datePattern = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/;

    for (const line of lines) {
      const dateMatch = line.match(datePattern);
      if (!dateMatch) continue;

      const date = this.parseDate(dateMatch[1]);
      if (!date) continue;

      const rest = line.replace(dateMatch[0], '').trim();
      const amountMatch = rest.match(/([\d.,]{4,})\s*$/);

      if (amountMatch) {
        const description = rest.replace(amountMatch[0], '').trim();
        const amount = this.parseAmount(amountMatch[1]);

        if (amount > 0 && description.length > 0) {
          transactions.push({
            tempId: this.generateTempId(txnIndex++),
            date,
            description,
            amount,
            type: 'EXPENSE',
          });
        }
      }
    }
  }
}
