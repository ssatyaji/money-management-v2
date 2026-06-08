import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Budget } from '@prisma/client';

@Injectable()
export class BudgetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BudgetUncheckedCreateInput): Promise<Budget> {
    return this.prisma.budget.create({
      data,
      include: { category: true },
    });
  }

  async findAll(params: {
    where?: Prisma.BudgetWhereInput;
    orderBy?: Prisma.BudgetOrderByWithRelationInput;
  }) {
    return this.prisma.budget.findMany({
      where: params.where,
      orderBy: params.orderBy || { startDate: 'desc' },
      include: { category: true },
    });
  }

  async findById(id: string) {
    return this.prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async update(
    id: string,
    data: Prisma.BudgetUncheckedUpdateInput,
  ): Promise<Budget> {
    return this.prisma.budget.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string): Promise<Budget> {
    return this.prisma.budget.delete({ where: { id } });
  }

  async findActiveBudgets(userId: string, date: Date = new Date()) {
    return this.prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });
  }

  async calculateSpent(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount) || 0;
  }
}
