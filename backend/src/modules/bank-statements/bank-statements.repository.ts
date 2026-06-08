import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BankName, ProcessingStatus, Prisma } from '@prisma/client';

@Injectable()
export class BankStatementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    fileName: string;
    filePath: string;
    bankName: BankName;
    userId: string;
    status?: ProcessingStatus;
    statementDate?: Date;
    errorMessage?: string;
    processedAt?: Date;
  }) {
    return this.prisma.bankStatement.create({
      data: {
        fileName: data.fileName,
        filePath: data.filePath,
        bankName: data.bankName,
        status: data.status || 'PENDING',
        statementDate: data.statementDate,
        errorMessage: data.errorMessage,
        processedAt: data.processedAt,
        userId: data.userId,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.bankStatement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        bankName: true,
        status: true,
        statementDate: true,
        processedAt: true,
        createdAt: true,
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  async findOneByUser(userId: string, id: string) {
    return this.prisma.bankStatement.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    status: ProcessingStatus,
    extra?: { errorMessage?: string; processedAt?: Date; statementDate?: Date },
  ) {
    return this.prisma.bankStatement.update({
      where: { id },
      data: {
        status,
        ...extra,
      },
    });
  }

  async createTransactions(
    data: {
      amount: number;
      type: 'INCOME' | 'EXPENSE';
      description: string;
      date: Date;
      categoryId: string;
      userId: string;
      bankStatementId: string;
      source: 'BANK_IMPORT';
    }[],
  ) {
    return this.prisma.transaction.createMany({
      data: data.map((txn) => ({
        amount: new Prisma.Decimal(txn.amount),
        type: txn.type,
        description: txn.description,
        date: txn.date,
        categoryId: txn.categoryId,
        userId: txn.userId,
        bankStatementId: txn.bankStatementId,
        source: txn.source,
      })),
    });
  }
}
