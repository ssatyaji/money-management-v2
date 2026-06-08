import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyReport(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Income & expense totals
    const summary = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Category breakdown
    const categoryBreakdown = await this.prisma.$queryRaw<
      Array<{
        categoryId: string;
        categoryName: string;
        categoryIcon: string | null;
        categoryColor: string | null;
        type: string;
        total: number;
        count: bigint;
      }>
    >`
      SELECT
        t."categoryId",
        c."name" AS "categoryName",
        c."icon" AS "categoryIcon",
        c."color" AS "categoryColor",
        t."type",
        CAST(SUM(t."amount") AS DOUBLE PRECISION) AS "total",
        COUNT(*)::bigint AS "count"
      FROM "Transaction" t
      JOIN "Category" c ON t."categoryId" = c."id"
      WHERE t."userId" = ${userId}
        AND t."date" >= ${startDate}
        AND t."date" <= ${endDate}
      GROUP BY t."categoryId", c."name", c."icon", c."color", t."type"
      ORDER BY "total" DESC
    `;

    // Daily totals
    const dailyData = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, amount: true, type: true },
      orderBy: { date: 'asc' },
    });

    const dailyMap = new Map<string, { income: number; expense: number }>();
    dailyData.forEach((tx) => {
      const key = tx.date.toISOString().split('T')[0];
      const existing = dailyMap.get(key) || { income: 0, expense: 0 };
      if (tx.type === 'INCOME') existing.income += Number(tx.amount);
      else existing.expense += Number(tx.amount);
      dailyMap.set(key, existing);
    });

    let totalIncome = 0;
    let totalExpense = 0;
    summary.forEach((s) => {
      if (s.type === 'INCOME') totalIncome = Number(s._sum.amount) || 0;
      if (s.type === 'EXPENSE') totalExpense = Number(s._sum.amount) || 0;
    });

    return {
      month,
      year,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: summary.reduce((sum, s) => sum + s._count, 0),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        categoryId: c.categoryId,
        name: c.categoryName,
        icon: c.categoryIcon,
        color: c.categoryColor,
        type: c.type,
        total: Number(c.total),
        count: Number(c.count),
      })),
      dailyTrend: Array.from(dailyMap.entries()).map(([date, v]) => ({
        date,
        income: v.income,
        expense: v.expense,
      })),
    };
  }

  async getYearlyReport(userId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    // Monthly aggregation
    const monthlyData = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, amount: true, type: true },
      orderBy: { date: 'asc' },
    });

    const monthlyMap = new Map<
      number,
      { income: number; expense: number; count: number }
    >();
    for (let m = 1; m <= 12; m++) {
      monthlyMap.set(m, { income: 0, expense: 0, count: 0 });
    }

    monthlyData.forEach((tx) => {
      const m = tx.date.getMonth() + 1;
      const existing = monthlyMap.get(m)!;
      if (tx.type === 'INCOME') existing.income += Number(tx.amount);
      else existing.expense += Number(tx.amount);
      existing.count++;
    });

    // Category breakdown for the year
    const categoryBreakdown = await this.prisma.$queryRaw<
      Array<{
        categoryId: string;
        categoryName: string;
        categoryIcon: string | null;
        categoryColor: string | null;
        type: string;
        total: number;
        count: bigint;
      }>
    >`
      SELECT
        t."categoryId",
        c."name" AS "categoryName",
        c."icon" AS "categoryIcon",
        c."color" AS "categoryColor",
        t."type",
        CAST(SUM(t."amount") AS DOUBLE PRECISION) AS "total",
        COUNT(*)::bigint AS "count"
      FROM "Transaction" t
      JOIN "Category" c ON t."categoryId" = c."id"
      WHERE t."userId" = ${userId}
        AND t."date" >= ${startDate}
        AND t."date" <= ${endDate}
      GROUP BY t."categoryId", c."name", c."icon", c."color", t."type"
      ORDER BY "total" DESC
    `;

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    const months = Array.from(monthlyMap.entries()).map(([m, v]) => ({
      month: m,
      name: monthNames[m - 1],
      income: v.income,
      expense: v.expense,
      balance: v.income - v.expense,
      count: v.count,
    }));

    const totalIncome = months.reduce((s, m) => s + m.income, 0);
    const totalExpense = months.reduce((s, m) => s + m.expense, 0);

    return {
      year,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      avgMonthlyIncome: Math.round(totalIncome / 12),
      avgMonthlyExpense: Math.round(totalExpense / 12),
      months,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        categoryId: c.categoryId,
        name: c.categoryName,
        icon: c.categoryIcon,
        color: c.categoryColor,
        type: c.type,
        total: Number(c.total),
        count: Number(c.count),
      })),
    };
  }
}
