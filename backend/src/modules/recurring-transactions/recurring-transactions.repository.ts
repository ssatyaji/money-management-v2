import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, RecurringTransaction } from '@prisma/client';

@Injectable()
export class RecurringTransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.RecurringTransactionUncheckedCreateInput): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.create({
      data,
      include: { category: true, account: true },
    });
  }

  async findAll(params: {
    where?: Prisma.RecurringTransactionWhereInput;
    orderBy?: Prisma.RecurringTransactionOrderByWithRelationInput;
  }): Promise<RecurringTransaction[]> {
    return this.prisma.recurringTransaction.findMany({
      where: params.where,
      orderBy: params.orderBy || { createdAt: 'desc' },
      include: { category: true, account: true },
    });
  }

  async findById(id: string): Promise<RecurringTransaction | null> {
    return this.prisma.recurringTransaction.findUnique({
      where: { id },
      include: { category: true, account: true },
    });
  }

  async update(
    id: string,
    data: Prisma.RecurringTransactionUncheckedUpdateInput,
  ): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.update({
      where: { id },
      data,
      include: { category: true, account: true },
    });
  }

  async delete(id: string): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.delete({ where: { id } });
  }

  async findDue(): Promise<RecurringTransaction[]> {
    const today = new Date();
    // Clear time for date-only comparison or do direct <=
    return this.prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextDueDate: { lte: today },
      },
      include: { category: true, account: true },
    });
  }
}
