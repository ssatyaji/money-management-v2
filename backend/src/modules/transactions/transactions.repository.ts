import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Transaction, TransactionType } from '@prisma/client';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.TransactionUncheckedCreateInput,
  ): Promise<Transaction> {
    return this.prisma.transaction.create({
      data,
      include: { category: true },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.TransactionWhereInput;
    orderBy?: Prisma.TransactionOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { date: 'desc' },
        include: { category: true, account: true, destinationAccount: true },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<
    | (Transaction & {
        category: { name: string; icon: string | null; color: string | null };
        account: { id: string; name: string; color: string | null } | null;
        destinationAccount: { id: string; name: string; color: string | null } | null;
      })
    | null
  > {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true, account: true, destinationAccount: true },
    });
  }

  async update(
    id: string,
    data: Prisma.TransactionUncheckedUpdateInput,
  ): Promise<Transaction> {
    return this.prisma.transaction.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string): Promise<Transaction> {
    return this.prisma.transaction.delete({ where: { id } });
  }

  async getSummaryByDateRange(userId: string, startDate: Date, endDate: Date) {
    const result = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    return result;
  }

  async getCategoryBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
    type: string,
  ) {
    const result = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: type as TransactionType,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Fetch category details
    const categoryIds = result.map((r) => r.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return result.map((r) => ({
      categoryId: r.categoryId,
      category: categoryMap.get(r.categoryId),
      total: r._sum.amount,
      count: r._count,
    }));
  }

  async getDailyTrend(userId: string, startDate: Date, endDate: Date) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      select: {
        date: true,
        amount: true,
        type: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const dailyMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach((tx) => {
      const dateKey = tx.date.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { income: 0, expense: 0 };

      if (tx.type === 'INCOME') {
        existing.income += Number(tx.amount);
      } else if (tx.type === 'EXPENSE') {
        existing.expense += Number(tx.amount);
      }

      dailyMap.set(dateKey, existing);
    });

    return Array.from(dailyMap.entries()).map(([date, values]) => ({
      date,
      income: values.income,
      expense: values.expense,
    }));
  }

  async getRecentTransactions(userId: string, limit: number = 5) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
      include: { category: true, account: true, destinationAccount: true },
    });
  }

  async getAllTimeBalance(userId: string): Promise<number> {
    const allTimeSummary = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    });

    let allTimeIncome = 0;
    let allTimeExpense = 0;
    allTimeSummary.forEach((s) => {
      if (s.type === 'INCOME') allTimeIncome = Number(s._sum.amount) || 0;
      if (s.type === 'EXPENSE') allTimeExpense = Number(s._sum.amount) || 0;
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { startingBalance: true },
    });
    const userStartingBalance = Number(user?.startingBalance) || 0;

    const wallets = await this.prisma.account.findMany({
      where: { userId },
      select: { startingBalance: true },
    });
    const walletsStartingBalance = wallets.reduce((sum, w) => sum + (Number(w.startingBalance) || 0), 0);

    return userStartingBalance + walletsStartingBalance + allTimeIncome - allTimeExpense;
  }
}
