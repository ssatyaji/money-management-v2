/* eslint-disable @typescript-eslint/require-await */
import { BankName } from '@prisma/client';
import {
  BaseStatementParser,
  ParsedStatement,
  ParsedTransaction,
} from './base-statement.parser';

/**
 * Parser for Bank Jago e-statements.
 * Supports both multi-line digital e-statements (Official History Pocket PDF)
 * and single-line legacy format statements.
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
    let accountHolder: string | undefined;

    // 1. Extract Account Number
    // Pattern A: "Main Pocket 107193004147" or "Pocket 1234567890"
    const pocketMatch = text.match(
      /(?:main\s+pocket|pocket|kantong)\s+(\d{8,16})/i,
    );
    if (pocketMatch) {
      accountNumber = pocketMatch[1];
    } else {
      const accMatch = text.match(
        /(?:nomor\s*(?:rekening|akun)|account)[:\s]*(\d[\d\s\-.]+\d)/i,
      );
      if (accMatch) {
        accountNumber = accMatch[1].replace(/[\s\-.]/g, '');
      }
    }

    // 2. Extract Account Holder
    // Line before "Main Pocket <accountNumber>" or after "Pockets Transactions History"
    for (let i = 0; i < lines.length; i++) {
      if (/(?:main\s+pocket|pocket|kantong)\s+\d{8,16}/i.test(lines[i])) {
        if (
          i > 0 &&
          /^[A-Z][a-zA-Z\s'.]+$/.test(lines[i - 1]) &&
          !lines[i - 1].includes('Page')
        ) {
          accountHolder = lines[i - 1];
          break;
        }
      }
    }

    // 3. Extract Statement Period Date
    // Pattern A: "01 Jul 2026 - 31 Jul 2026"
    const dateRangeMatch = text.match(
      /(\d{1,2}\s+\w+\s+\d{4})\s*[-–]\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    );
    if (dateRangeMatch) {
      const parsed = this.parseDate(dateRangeMatch[2]);
      if (parsed) statementDate = parsed;
    } else {
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
    }

    // 4. Parse Transactions (Multi-line block parser)
    this.parseMultiLineBlocks(lines, transactions);

    // Fallback: single-line matching if multi-line returned no transactions
    if (transactions.length === 0) {
      this.parseSingleLine(lines, transactions);
    }

    // Secondary Fallback: generic date + amount parsing
    if (transactions.length === 0) {
      this.parseFallback(lines, transactions);
    }

    return { transactions, statementDate, accountNumber, accountHolder };
  }

  private parseMultiLineBlocks(
    lines: string[],
    transactions: ParsedTransaction[],
  ): void {
    let txnIndex = 0;

    // Date header line regex: "01 Jul 2026" or "01/07/2026"
    const datePattern =
      /^(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})$/;
    // Amount line regex: "-3.000 7.507,28" or "+30.000,00 30.507,28" or "-10.000"
    const amountLinePattern = /^([+-])\s*([\d.,]+)(?:\s+([\d.,]+))?$/;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        const txnDate = this.parseDate(dateMatch[1]);
        if (!txnDate) {
          i++;
          continue;
        }

        // Collect lines until amount line is found or next date/end of lines
        i++;
        const blockLines: string[] = [];
        let amountMatch: RegExpMatchArray | null = null;

        while (i < lines.length) {
          const currentLine = lines[i];

          // Check if current line is amount line
          const amtCheck = currentLine.match(amountLinePattern);
          if (amtCheck) {
            amountMatch = amtCheck;
            i++;
            break;
          }

          // Check if hit next date header (abandon uncompleted block)
          if (datePattern.test(currentLine)) {
            break;
          }

          blockLines.push(currentLine);
          i++;
        }

        if (amountMatch) {
          const sign = amountMatch[1];
          const amount = this.parseAmount(amountMatch[2]);
          const balance = amountMatch[3]
            ? this.parseAmount(amountMatch[3])
            : undefined;

          // Filter out time line (e.g. "04:48"), ID lines (e.g. "ID# ..."), and header labels
          const cleanDescParts = blockLines.filter((l) => {
            if (/^\d{2}:\d{2}$/.test(l)) return false;
            if (/^ID#/i.test(l)) return false;
            if (
              /^(Date & Time|Source\/Destination|Transaction Details|Notes|Amount|Balance)$/i.test(
                l,
              )
            )
              return false;
            if (
              /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i.test(
                l,
              )
            )
              return false;
            return true;
          });

          const description =
            cleanDescParts.join(' ').trim() || 'Jago Transaction';

          if (amount > 0) {
            transactions.push({
              tempId: this.generateTempId(txnIndex++),
              date: txnDate,
              description,
              amount,
              type: sign === '-' ? 'EXPENSE' : 'INCOME',
              ...(balance !== undefined && { balance }),
            });
          }
        }
      } else {
        i++;
      }
    }
  }

  private parseSingleLine(
    lines: string[],
    transactions: ParsedTransaction[],
  ): void {
    let txnIndex = transactions.length;

    const pattern1 =
      /(\d{1,2}\s+\w+\s+\d{4})\s+(.+?)\s+([+-]?)\s*(?:Rp\.?\s*)?([\d.,]+)/i;
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
  }

  private parseFallback(
    lines: string[],
    transactions: ParsedTransaction[],
  ): void {
    let txnIndex = transactions.length;
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
