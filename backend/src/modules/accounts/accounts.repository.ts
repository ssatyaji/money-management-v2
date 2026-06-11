import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Account } from '@prisma/client';

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AccountUncheckedCreateInput): Promise<Account> {
    return this.prisma.account.create({ data });
  }

  async findAll(params: {
    where?: Prisma.AccountWhereInput;
    orderBy?: Prisma.AccountOrderByWithRelationInput;
  }): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: params.where,
      orderBy: params.orderBy || { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.AccountUncheckedUpdateInput,
  ): Promise<Account> {
    return this.prisma.account.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Account> {
    return this.prisma.account.delete({ where: { id } });
  }

  async getUserStartingBalance(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { startingBalance: true, createdAt: true, updatedAt: true },
    });
  }

  async calculateBalance(
    userId: string,
    accountId: string | null,
    startingBalance: number,
  ): Promise<number> {
    const isMain = accountId === null || accountId === 'main';
    const filterAccountId = isMain ? null : accountId;

    const income = await this.prisma.transaction.aggregate({
      where: {
        userId,
        accountId: filterAccountId,
        type: 'INCOME',
      },
      _sum: { amount: true },
    });

    const expense = await this.prisma.transaction.aggregate({
      where: {
        userId,
        accountId: filterAccountId,
        type: 'EXPENSE',
      },
      _sum: { amount: true },
    });

    const incomingTransfer = await this.prisma.transaction.aggregate({
      where: {
        userId,
        destinationAccountId: filterAccountId,
        type: 'TRANSFER',
      },
      _sum: { amount: true },
    });

    const outgoingTransfer = await this.prisma.transaction.aggregate({
      where: {
        userId,
        accountId: filterAccountId,
        type: 'TRANSFER',
      },
      _sum: { amount: true },
    });

    return (
      startingBalance +
      (Number(income._sum.amount) || 0) -
      (Number(expense._sum.amount) || 0) +
      (Number(incomingTransfer._sum.amount) || 0) -
      (Number(outgoingTransfer._sum.amount) || 0)
    );
  }
}
