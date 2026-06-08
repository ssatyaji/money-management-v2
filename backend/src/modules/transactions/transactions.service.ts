import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionsRepository: TransactionsRepository) {}

  async create(userId: string, dto: CreateTransactionDto) {
    return this.transactionsRepository.create({
      amount: dto.amount,
      type: dto.type,
      description: dto.description,
      note: dto.note,
      date: new Date(dto.date),
      categoryId: dto.categoryId,
      userId,
      source: 'MANUAL',
    });
  }

  async findAll(userId: string, filters: FilterTransactionDto): Promise<PaginatedResult<any>> {
    const where: Prisma.TransactionWhereInput = { userId };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate + 'T23:59:59.999Z');
      }
    }

    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { note: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const { data, total } = await this.transactionsRepository.findAll({
      skip: filters.skip,
      take: filters.limit,
      where,
    });

    return {
      success: true,
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findById(userId: string, id: string) {
    const transaction = await this.transactionsRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.findById(userId, id); // validates ownership

    const updateData: Prisma.TransactionUncheckedUpdateInput = {};
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.note !== undefined) updateData.note = dto.note;
    if (dto.date !== undefined) updateData.date = new Date(dto.date);
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;

    return this.transactionsRepository.update(id, updateData);
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);
    return this.transactionsRepository.delete(id);
  }

  async getSummary(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const summary = await this.transactionsRepository.getSummaryByDateRange(
      userId, startDate, endDate,
    );

    let totalIncome = 0;
    let totalExpense = 0;

    summary.forEach((s) => {
      if (s.type === 'INCOME') totalIncome = Number(s._sum.amount) || 0;
      if (s.type === 'EXPENSE') totalExpense = Number(s._sum.amount) || 0;
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      month,
      year,
    };
  }

  async getCategoryBreakdown(userId: string, month: number, year: number, type: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.transactionsRepository.getCategoryBreakdown(
      userId, startDate, endDate, type,
    );
  }

  async getDailyTrend(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.transactionsRepository.getDailyTrend(userId, startDate, endDate);
  }

  async getRecentTransactions(userId: string, limit: number = 5) {
    return this.transactionsRepository.getRecentTransactions(userId, limit);
  }
}
