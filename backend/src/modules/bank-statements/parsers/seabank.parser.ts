import { BankName } from '@prisma/client';
import { BaseStatementParser, ParsedStatement, ParsedTransaction } from './base-statement.parser';

/**
 * Parser for SeaBank e-statements.
 *
 * Typical SeaBank statement format (digital bank):
 * - Digital-first PDF layout
 * - Transaction list: Date, Description, Amount (with +/- or Masuk/Keluar)
 * - Date format: DD/MM/YYYY or DD MMM YYYY
 * - Amount: Rp format with dot thousands separator
 */
export class SeabankParser extends BaseStatementParser {
  getBankName(): BankName {
    return 'SEABANK';
  }

  validate(text: string): boolean {
    const keywords = ['seabank', 'sea bank', 'pt bank seabank', 'pt seabank'];
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw));
  }

  async parse(text: string): Promise<ParsedStatement> {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const transactions: ParsedTransaction[] = [];
    let statementDate: Date | undefined;
    let accountNumber: string | undefined;

    // Extract account number
    const accMatch = text.match(/(?:nomor\s*(?:rekening|akun)|account)[:\s]*(\d[\d\s\-.]+\d)/i);
    if (accMatch) {
      accountNumber = accMatch[1].replace(/[\s\-.]/g, '');
    }

    // Extract period
    const periodMatch = text.match(/(?:periode|period)[:\s]*(.+?)(?:\n|$)/i);
    if (periodMatch) {
      const parsed = this.parseDate(periodMatch[1].trim().split(/\s*[-–]\s*/).pop() || '');
      if (parsed) statementDate = parsed;
    }

    let txnIndex = 0;

    // SeaBank pattern: Date  Description  Amount(+/-)
    // "01/06/2026  Transfer dari USER  +500.000"
    // "02/06/2026  Pembayaran QRIS  -75.000"
    const pattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([+-])\s*(?:Rp\.?\s*)?([\d.,]+)/i;

    for (const line of lines) {
      const match = line.match(pattern);
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
          type: sign === '+' ? 'INCOME' : 'EXPENSE',
        });
        continue;
      }

      // Alternative pattern without explicit sign
      // "01/06/2026  QRIS Payment  75,000  Keluar"
      const altMatch = line.match(
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([\d.,]+)\s*(masuk|keluar|in|out|kredit|debit)/i,
      );
      if (altMatch) {
        const date = this.parseDate(altMatch[1]);
        if (!date) continue;

        const description = altMatch[2].trim();
        const amount = this.parseAmount(altMatch[3]);
        const typeStr = altMatch[4].toLowerCase();

        if (amount <= 0) continue;

        const isIncome = ['masuk', 'in', 'kredit'].includes(typeStr);

        transactions.push({
          tempId: this.generateTempId(txnIndex++),
          date,
          description,
          amount,
          type: isIncome ? 'INCOME' : 'EXPENSE',
        });
      }
    }

    // Fallback
    if (transactions.length === 0) {
      this.parseFallback(lines, transactions);
    }

    return { transactions, statementDate, accountNumber };
  }

  private parseFallback(lines: string[], transactions: ParsedTransaction[]): void {
    let txnIndex = 0;
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;

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
