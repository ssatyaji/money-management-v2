import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalTransactions,
      totalBudgets,
      totalReminders,
      totalIncomeData,
      totalExpenseData,
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
    };
  }
}
