/* eslint-disable @typescript-eslint/require-await */
import { BankName } from '@prisma/client';
import {
  BaseStatementParser,
  ParsedStatement,
  ParsedTransaction,
} from './base-statement.parser';

/**
 * Parser for BCA (Bank Central Asia) e-statements.
 *
 * Typical BCA e-statement format:
 * - Well-structured table layout
 * - Columns: TANGGAL | KETERANGAN | CBG | MUTASI | SALDO
 * - Date format: DD/MM (year from statement header)
 * - Amount format: 1.234.567,00
 * - Debit/Credit indicated by "DB" or "CR" suffix
 */
export class BcaParser extends BaseStatementParser {
  getBankName(): BankName {
    return 'BCA';
  }

  validate(text: string): boolean {
    const keywords = ['bca', 'bank central asia', 'pt bank central asia'];
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
    let statementYear: number = new Date().getFullYear();

    // Extract account number
    const accMatch = text.match(
      /(?:nomor\s*(?:rekening|akun)|no\.?\s*rek(?:ening)?)[:\s]*(\d[\d\s\-.]+\d)/i,
    );
    if (accMatch) {
      accountNumber = accMatch[1].replace(/[\s\-.]/g, '');
    }

    // Extract statement period to get the year
    const periodMatch = text.match(/(?:periode|period)[:\s]*(.+?)(?:\n|$)/i);
    if (periodMatch) {
      const yearMatch = periodMatch[1].match(/(\d{4})/);
      if (yearMatch) {
        statementYear = parseInt(yearMatch[1]);
      }
      const dateStr =
        periodMatch[1]
          .trim()
          .split(/\s*[-–]\s*/)
          .pop() || '';
      const parsed = this.parseDate(dateStr);
      if (parsed) statementDate = parsed;
    }

    let txnIndex = 0;

    // BCA pattern 1: "DD/MM  KETERANGAN  1.234.567,00 DB" or "CR"
    const bcaPattern =
      /^(\d{1,2}[/-]\d{1,2})\s+(.+?)\s+([\d.,]+(?:,\d{2}))\s*(DB|CR|D|C)$/i;

    for (const line of lines) {
      const match = line.match(bcaPattern);
      if (match) {
        // BCA uses DD/MM without year, prepend the statement year
        const dateStr = `${match[1]}/${statementYear}`;
        const date = this.parseDate(dateStr);
        if (!date) continue;

        const description = match[2].trim();
        const amount = this.parseAmount(match[3]);
        const indicator = match[4].toUpperCase();

        if (amount <= 0) continue;

        transactions.push({
          tempId: this.generateTempId(txnIndex++),
          date,
          description,
          amount,
          type: indicator === 'CR' || indicator === 'C' ? 'INCOME' : 'EXPENSE',
        });
        continue;
      }

      // Pattern 2: full date format "DD/MM/YYYY  Description  Amount  DB/CR"
      const fullDateMatch = line.match(
        /^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([\d.,]+)\s*(DB|CR|D|C)$/i,
      );
      if (fullDateMatch) {
        const date = this.parseDate(fullDateMatch[1]);
        if (!date) continue;

        const description = fullDateMatch[2].trim();
        const amount = this.parseAmount(fullDateMatch[3]);
        const indicator = fullDateMatch[4].toUpperCase();

        if (amount <= 0) continue;

        transactions.push({
          tempId: this.generateTempId(txnIndex++),
          date,
          description,
          amount,
          type: indicator === 'CR' || indicator === 'C' ? 'INCOME' : 'EXPENSE',
        });
      }
    }

    // Fallback: try to parse with separate debit/credit columns
    if (transactions.length === 0) {
      this.parseFallbackFormat(lines, transactions, statementYear);
    }

    return { transactions, statementDate, accountNumber };
  }

  private parseFallbackFormat(
    lines: string[],
    transactions: ParsedTransaction[],
    year: number,
  ): void {
    let txnIndex = 0;

    // Try pattern: "DD/MM  Description  DebitAmount  CreditAmount  Balance"
    const pattern = /^(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\s+(.+)/;

    for (const line of lines) {
      const match = line.match(pattern);
      if (!match) continue;

      let dateStr = match[1];
      if (dateStr.split(/[/-]/).length === 2) {
        dateStr = `${dateStr}/${year}`;
      }

      const date = this.parseDate(dateStr);
      if (!date) continue;

      const rest = match[2].trim();
      // Find all number groups in the rest
      const numbers = rest.match(/[\d.,]{4,}/g);
      if (!numbers || numbers.length === 0) continue;

      // Remove numbers from description
      let description = rest;
      for (const num of numbers) {
        description = description.replace(num, '');
      }
      description = description.replace(/\s+/g, ' ').trim();

      if (description.length < 2) continue;

      // First number is typically the transaction amount
      const amount = this.parseAmount(numbers[0]);
      if (amount <= 0) continue;

      transactions.push({
        tempId: this.generateTempId(txnIndex++),
        date,
        description,
        amount,
        type: 'EXPENSE', // Default, user can adjust
      });
    }
  }
}
