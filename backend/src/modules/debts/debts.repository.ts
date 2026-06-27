import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Debt, DebtPayment } from '@prisma/client';

@Injectable()
export class DebtsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.DebtUncheckedCreateInput): Promise<Debt> {
    return this.prisma.debt.create({ data });
  }

  async findAll(params: {
    where?: Prisma.DebtWhereInput;
    orderBy?: Prisma.DebtOrderByWithRelationInput;
  }): Promise<Debt[]> {
    return this.prisma.debt.findMany({
      where: params.where,
      orderBy: params.orderBy || { createdAt: 'desc' },
      include: {
        payments: {
          orderBy: { date: 'desc' },
          take: 3,
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.debt.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.DebtUncheckedUpdateInput,
  ): Promise<Debt> {
    return this.prisma.debt.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Debt> {
    return this.prisma.debt.delete({ where: { id } });
  }

  async addPayment(data: Prisma.DebtPaymentUncheckedCreateInput): Promise<DebtPayment> {
    return this.prisma.debtPayment.create({ data });
  }

  async getSummary(userId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { userId },
    });

    const receivables = debts.filter((d) => d.type === 'RECEIVABLE');
    const payables = debts.filter((d) => d.type === 'PAYABLE');

    const totalReceivable = receivables
      .filter((d) => d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + Number(d.totalAmount) - Number(d.paidAmount), 0);

    const totalPayable = payables
      .filter((d) => d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + Number(d.totalAmount) - Number(d.paidAmount), 0);

    const overdueCount = debts.filter((d) => {
      if (d.status === 'SETTLED' || d.status === 'CANCELLED') return false;
      if (!d.dueDate) return false;
      return new Date(d.dueDate) < new Date();
    }).length;

    return {
      totalReceivable,
      totalPayable,
      netPosition: totalReceivable - totalPayable,
      totalDebts: debts.length,
      activeDebts: debts.filter((d) => d.status === 'ACTIVE' || d.status === 'PARTIALLY_PAID').length,
      settledDebts: debts.filter((d) => d.status === 'SETTLED').length,
      overdueCount,
    };
  }
}
