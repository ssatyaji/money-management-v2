import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ParsedTransaction } from '../parsers/base-statement.parser';

export interface EnrichedParsedTransaction extends ParsedTransaction {
  isPossibleDuplicate?: boolean;
  isInterAccountTransfer?: boolean;
  matchedTransactionId?: string;
  matchedAccountName?: string;
  recommendationNote?: string;
}

const TRANSFER_KEYWORDS = [
  'TRSF',
  'TRANSFER',
  'BI-FAST',
  'SKN',
  'JAGO',
  'PERMATA',
  'BCA',
  'SEABANK',
  'MBANKING',
];

@Injectable()
export class AiTransactionDeduplicator {
  constructor(private readonly prisma: PrismaService) {}

  async matchDuplicatesAndTransfers(
    userId: string,
    parsedTxns: ParsedTransaction[],
  ): Promise<EnrichedParsedTransaction[]> {
    if (!parsedTxns || parsedTxns.length === 0) return [];

    const dates = parsedTxns.map((t) => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates) - 3 * 24 * 60 * 60 * 1000);
    const maxDate = new Date(Math.max(...dates) + 3 * 24 * 60 * 60 * 1000);

    const existingTxns = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: minDate, lte: maxDate },
      },
      include: { account: true },
    });

    return parsedTxns.map((tx) => {
      const txAmount = Number(tx.amount);
      const txDate = new Date(tx.date).getTime();
      const descUpper = tx.description.toUpperCase();
      const hasTransferKeyword = TRANSFER_KEYWORDS.some((kw) =>
        descUpper.includes(kw),
      );

      // 1. Check Inter-Account Transfer Match (opposite type, same amount, ±3 days, transfer keyword)
      const transferMatch = existingTxns.find((ex) => {
        const exAmount = Number(ex.amount);
        const exDate = new Date(ex.date).getTime();
        const daysDiff =
          Math.abs(txDate - exDate) / (1000 * 60 * 60 * 24);
        const isOppositeType =
          (tx.type === 'EXPENSE' && ex.type === 'INCOME') ||
          (tx.type === 'INCOME' && ex.type === 'EXPENSE');

        return (
          exAmount === txAmount &&
          daysDiff <= 3 &&
          isOppositeType &&
          hasTransferKeyword
        );
      });

      if (transferMatch) {
        return {
          ...tx,
          isInterAccountTransfer: true,
          matchedTransactionId: transferMatch.id,
          matchedAccountName: transferMatch.account?.name || 'Rekening Lain',
          recommendationNote: `Terdeteksi pasangan transfer ke ${transferMatch.account?.name || 'rekening lain'}`,
        };
      }

      // 2. Check Exact Duplicate Match (same type, same amount, ±1 day)
      const dupMatch = existingTxns.find((ex) => {
        const exAmount = Number(ex.amount);
        const exDate = new Date(ex.date).getTime();
        const daysDiff =
          Math.abs(txDate - exDate) / (1000 * 60 * 60 * 24);

        return exAmount === txAmount && daysDiff <= 1 && ex.type === tx.type;
      });

      if (dupMatch) {
        return {
          ...tx,
          isPossibleDuplicate: true,
          matchedTransactionId: dupMatch.id,
          recommendationNote: 'Transaksi serupa sudah ada di database',
        };
      }

      return tx;
    });
  }
}
