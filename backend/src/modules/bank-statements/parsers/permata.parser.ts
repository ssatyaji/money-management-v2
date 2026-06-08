import { BankName } from '@prisma/client';
import { BaseStatementParser, ParsedStatement, ParsedTransaction } from './base-statement.parser';

/**
 * Parser for Bank Permata e-statements.
 *
 * Typical Permata statement format:
 * - Header: Account number, statement period
 * - Table columns: Date | Description | Debit | Credit | Balance
 * - Date format: DD/MM/YYYY
 * - Amount format: 1.234.567,89 (Indonesian)
 */
export class PermataParser extends BaseStatementParser {
  getBankName(): BankName {
    return 'PERMATA';
  }

  validate(text: string): boolean {
    const keywords = ['permata', 'permatabank', 'pt bank permata'];
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw));
  }

  async parse(text: string): Promise<ParsedStatement> {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const transactions: ParsedTransaction[] = [];
    let statementDate: Date | undefined;
    let accountNumber: string | undefined;

    // Try to extract account number
    const accMatch = text.match(/(?:nomor\s*(?:rekening|akun)|account\s*(?:no|number))[:\s]*(\d[\d\s\-.]+\d)/i);
    if (accMatch) {
      accountNumber = accMatch[1].replace(/[\s\-.]/g, '');
    }

    // Try to extract statement period
    const periodMatch = text.match(/(?:periode|period)[:\s]*(.+?)(?:\n|$)/i);
    if (periodMatch) {
      const dateStr = periodMatch[1].trim();
      const parsed = this.parseDate(dateStr.split(/\s*[-–]\s*/)[1] || dateStr);
      if (parsed) statementDate = parsed;
    }

    // Parse transaction lines
    // Pattern: DD/MM/YYYY  Description  Amount  (Debit/Credit indicator)
    const txnPattern = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([\d.,]+(?:\.\d{2})?)\s*(?:(DB|CR|D|C))?\s*(?:([\d.,]+))?\s*$/i;

    let txnIndex = 0;
    for (const line of lines) {
      const match = line.match(txnPattern);
      if (match) {
        const date = this.parseDate(match[1]);
        if (!date) continue;

        const description = match[2].trim();
        const amount = this.parseAmount(match[3]);
        const indicator = (match[4] || '').toUpperCase();

        if (amount <= 0) continue;

        const type = indicator === 'CR' || indicator === 'C' ? 'INCOME' : 'EXPENSE';

        transactions.push({
          tempId: this.generateTempId(txnIndex++),
          date,
          description,
          amount,
          type,
          balance: match[5] ? this.parseAmount(match[5]) : undefined,
        });
      }
    }

    // Fallback: try a simpler pattern if no transactions found
    if (transactions.length === 0) {
      this.parseSimpleFormat(lines, transactions);
    }

    return { transactions, statementDate, accountNumber };
  }

  private parseSimpleFormat(lines: string[], transactions: ParsedTransaction[]): void {
    let txnIndex = 0;
    const datePattern = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;

    for (let i = 0; i < lines.length; i++) {
      const dateMatch = lines[i].match(datePattern);
      if (dateMatch) {
        const date = this.parseDate(dateMatch[1]);
        if (!date) continue;

        // Look for amount in the same or next line
        const restOfLine = lines[i].substring(dateMatch[0].length).trim();
        const amountMatch = restOfLine.match(/([\d.,]{4,})\s*$/);

        if (amountMatch) {
          const description = restOfLine.replace(amountMatch[0], '').trim();
          const amount = this.parseAmount(amountMatch[1]);

          if (amount > 0 && description.length > 0) {
            transactions.push({
              tempId: this.generateTempId(txnIndex++),
              date,
              description,
              amount,
              type: 'EXPENSE', // Default to expense, user can change
            });
          }
        }
      }
    }
  }
}
