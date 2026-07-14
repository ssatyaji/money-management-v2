import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      totalTransactions,
      totalBudgets,
      totalReminders,
      totalIncomeData,
      totalExpenseData,
      onlineUsers,
      activeToday,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.budget.count(),
      this.prisma.reminder.count(),
      this.prisma.transaction.aggregate({
        where: { type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: {
          lastActivityAt: {
            gte: fiveMinutesAgo,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          lastActivityAt: {
            gte: startOfToday,
          },
        },
      }),
    ]);

    return {
      users: totalUsers,
      transactions: totalTransactions,
      budgets: totalBudgets,
      reminders: totalReminders,
      totalIncome: totalIncomeData._sum.amount
        ? Number(totalIncomeData._sum.amount)
        : 0,
      totalExpense: totalExpenseData._sum.amount
        ? Number(totalExpenseData._sum.amount)
        : 0,
      onlineUsers,
      activeToday,
    };
  }

  async getActivityLogs(query: { page: number; limit: number; search?: string; userId?: string; action?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.action) {
      where.action = query.action;
    }
    if (query.search) {
      where.OR = [
        { details: { contains: query.search, mode: 'insensitive' } },
        { action: { contains: query.search, mode: 'insensitive' } },
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
