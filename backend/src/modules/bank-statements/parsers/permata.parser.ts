/* eslint-disable @typescript-eslint/require-await */
import { BankName } from '@prisma/client';
import {
  BaseStatementParser,
  ParsedStatement,
  ParsedTransaction,
} from './base-statement.parser';

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
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // Try Permata ME (Transaction History) format first if detected
    if (
      text.includes('Transaction History') ||
      /\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}/i.test(
        text,
      )
    ) {
      const meResult = this.parsePermataMeFormat(lines, text);
      if (meResult.transactions.length > 0) {
        return meResult;
      }
    }

    const transactions: ParsedTransaction[] = [];
    let statementDate: Date | undefined;
    let accountNumber: string | undefined;
    let statementYear = new Date().getFullYear();

    // Try to extract account number
    const accMatch = text.match(/(?:no\.?\s*rekening|account\s*no\.?)(?:\s*\n?[^\n]+){0,10}?\n\s*(\d{7,})/i);
    if (accMatch) {
      accountNumber = accMatch[1].trim();
    } else {
      // Fallback to simpler inline match
      const fallbackAccMatch = text.match(
        /(?:nomor\s*(?:rekening|akun)|account\s*(?:no|number)|no\.?\s*rek(?:ening)?)[:\s]*(\d[\d\s\-.]+\d)/i,
      );
      if (fallbackAccMatch) {
        accountNumber = fallbackAccMatch[1].replace(/[\s\-.]/g, '');
      }
    }

    // Try to extract statement period directly using date range pattern
    const dateRangeMatch = text.match(/(\d{1,2}\s+[a-z]+\s+\d{4})\s*[-–]\s*(\d{1,2}\s+[a-z]+\s+\d{4})/i);
    if (dateRangeMatch) {
      const yearMatch = dateRangeMatch[2].match(/(\d{4})/);
      if (yearMatch) {
        statementYear = parseInt(yearMatch[1]);
      }
      const parsed = this.parseDate(dateRangeMatch[2]);
      if (parsed) statementDate = parsed;
    } else {
      // Fallback to old period match
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
    }

    // Extract starting balance to determine INCOME vs EXPENSE via balance diff
    let startingBalance = 0;
    const startBalMatch = text.match(
      /(?:saldo\s*awal|beginning\s*balance)\s*([\d,]+\.\d{2})/i,
    );
    if (startBalMatch) {
      startingBalance = parseFloat(startBalMatch[1].replace(/,/g, ''));
    }

    const dateRangePattern = /^(\d{2}\/\d{2})\s+(\d{2}\/\d{2})\s+(.*)/;
    const amtBalPattern = /([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/;

    let currentTxn: {
      dateStr: string;
      descLines: string[];
      amount: number | null;
      balance: number | null;
    } | null = null;

    let txnIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(dateRangePattern);

      if (dateMatch) {
        // If there was an unfinished transaction, push it
        if (currentTxn) {
          this.pushTransaction(transactions, currentTxn, statementYear, txnIndex++);
        }

        const dateStr = dateMatch[1];
        const rest = dateMatch[3].trim();

        // Check if amount and balance are on the same line
        const amtBalMatch = rest.match(amtBalPattern);
        if (amtBalMatch) {
          const description = rest.substring(0, rest.length - amtBalMatch[0].length).trim();
          transactions.push({
            tempId: this.generateTempId(txnIndex++),
            date: this.parseDateWithYear(dateStr, statementYear) || new Date(),
            description,
            amount: this.parseAmount(amtBalMatch[1]),
            balance: this.parseAmount(amtBalMatch[2]),
            type: 'EXPENSE', // will determine later
          });
          currentTxn = null;
        } else {
          currentTxn = {
            dateStr,
            descLines: [rest],
            amount: null,
            balance: null,
          };
        }
      } else if (currentTxn) {
        const amtBalMatchOnly = line.match(/^([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/);
        if (amtBalMatchOnly) {
          currentTxn.amount = this.parseAmount(amtBalMatchOnly[1]);
          currentTxn.balance = this.parseAmount(amtBalMatchOnly[2]);
          this.pushTransaction(transactions, currentTxn, statementYear, txnIndex++);
          currentTxn = null;
        } else {
          if (
            line.includes('Halaman/Page') ||
            line.includes('No. Rekening') ||
            line.includes('Tgl Trx.') ||
            line.toLowerCase().includes('statement period') ||
            line.toLowerCase().includes('rekening koran')
          ) {
            // Skip page headers
          } else {
            currentTxn.descLines.push(line);
          }
        }
      }
    }

    if (currentTxn) {
      this.pushTransaction(transactions, currentTxn, statementYear, txnIndex++);
    }

    // Determine type by calculating balance difference
    let prevBalance = startingBalance;
    for (let j = 0; j < transactions.length; j++) {
      const t = transactions[j];
      if (t.balance !== undefined) {
        const diff = t.balance - prevBalance;
        if (diff > 0) {
          t.type = 'INCOME';
        } else {
          t.type = 'EXPENSE';
        }
        prevBalance = t.balance;
      } else {
        t.type = 'EXPENSE';
      }
    }

    // Fallback: try the old simple/regex pattern if no transactions found
    if (transactions.length === 0) {
      this.parseLegacyFormat(lines, transactions, statementYear);
    }

    return { transactions, statementDate, accountNumber };
  }

  private parsePermataMeFormat(lines: string[], text: string): ParsedStatement {
    const transactions: ParsedTransaction[] = [];
    let accountNumber: string | undefined;
    let statementDate: Date | undefined;

    // Account number match: e.g. "0000-0740-0756" or "0740-0756"
    const accMatch = text.match(/(?:Tabungan\s*\n?\s*)?(\d{4}-\d{4}-\d{4})/);
    if (accMatch) {
      accountNumber = accMatch[1].replace(/-/g, '');
    }

    const monthHeaderRegex =
      /^(?:January|February|March|April|May|June|July|August|September|October|November|December|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}$/i;

    const periodMatch = text.match(
      /(?:January|February|March|April|May|June|July|August|September|October|November|December|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}/i,
    );
    if (periodMatch) {
      statementDate = this.parseDate(`1 ${periodMatch[0]}`) || undefined;
    }

    const dateHeaderRegex =
      /^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})$/i;

    let currentDate: Date | null = null;
    let currentDescLines: string[] = [];
    let txnIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip page footers/headers
      if (
        !line ||
        line.includes('PT Bank Permata, Tbk.') ||
        line.includes('PermataBank.com') ||
        line.includes('Halaman/') ||
        line.includes('Page') ||
        /^--\s*\d+\s*of\s*\d+\s*--$/.test(line) ||
        line === 'Transaction History' ||
        line === 'Tabungan' ||
        /^\d{4}-\d{4}-\d{4}$/.test(line) ||
        monthHeaderRegex.test(line)
      ) {
        continue;
      }

      // Check if line is a Date Header (e.g. "25 July 2026")
      const dateMatch = line.match(dateHeaderRegex);
      if (dateMatch) {
        currentDate = this.parseDate(line);
        currentDescLines = [];
        continue;
      }

      // Check if line ends with an amount: e.g., "Rp 19,000,000.00" or "Rp 18,000.00"
      const amountMatch = line.match(/(?:Rp\s*)?([\d,]+\.\d{2})$/i);
      if (amountMatch && currentDate) {
        const amountStr = amountMatch[1];
        const lineWithoutAmount = line
          .substring(0, line.lastIndexOf(amountMatch[0]))
          .trim();

        if (lineWithoutAmount) {
          currentDescLines.push(lineWithoutAmount);
        }

        const fullDescription = currentDescLines
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        const amount = this.parseAmount(amountStr);

        if (amount > 0 && fullDescription) {
          const isIncome =
            /(?:INCOMING|TRF INCOMING|PB DARI|KREDIT|\bCR\b|SETORAN|BUNGA)/i.test(
              fullDescription,
            );

          let txnDate = new Date(currentDate);
          const timeMatch = fullDescription.match(
            /\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/,
          );
          if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
            txnDate = this.createWibDate(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate(),
              hours,
              minutes,
              seconds,
            );
          }

          transactions.push({
            tempId: this.generateTempId(txnIndex++),
            date: txnDate,
            description: fullDescription,
            amount,
            type: isIncome ? 'INCOME' : 'EXPENSE',
          });
        }

        currentDescLines = [];
      } else {
        currentDescLines.push(line);
      }
    }

    return { transactions, statementDate, accountNumber };
  }

  private parseDateWithYear(dateStr: string, year: number): Date | null {
    // dateStr is DD/MM
    return this.parseDate(`${dateStr}/${year}`);
  }

  private pushTransaction(
    transactions: ParsedTransaction[],
    raw: { dateStr: string; descLines: string[]; amount: number | null; balance: number | null },
    year: number,
    index: number,
  ): void {
    const date = this.parseDateWithYear(raw.dateStr, year) || new Date();
    const description = raw.descLines.join(' ').replace(/\s+/g, ' ').trim();
    transactions.push({
      tempId: this.generateTempId(index),
      date,
      description,
      amount: raw.amount || 0,
      balance: raw.balance || undefined,
      type: 'EXPENSE', // will determine later
    });
  }

  private parseLegacyFormat(
    lines: string[],
    transactions: ParsedTransaction[],
    statementYear: number,
  ): void {
    const txnPattern =
      /^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([\d.,]+(?:\.\d{2})?)\s*(?:(DB|CR|D|C))?\s*(?:([\d.,]+))?\s*$/i;

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

        const type =
          indicator === 'CR' || indicator === 'C' ? 'INCOME' : 'EXPENSE';

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

    if (transactions.length === 0) {
      this.parseSimpleFormat(lines, transactions, statementYear);
    }
  }

  private parseSimpleFormat(
    lines: string[],
    transactions: ParsedTransaction[],
    year: number,
  ): void {
    let txnIndex = 0;
    const datePattern = /^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/;

    for (let i = 0; i < lines.length; i++) {
      const dateMatch = lines[i].match(datePattern);
      if (dateMatch) {
        const date = this.parseDate(dateMatch[1]);
        if (!date) continue;

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
              type: 'EXPENSE',
            });
          }
        }
      }
    }
  }
}
