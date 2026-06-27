import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DebtsRepository } from './debts.repository';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { Debt } from '@prisma/client';

export interface EnrichedDebt extends Omit<Debt, 'totalAmount' | 'paidAmount'> {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progress: number;
  isOverdue: boolean;
  daysUntilDue: number | null;
  payments?: Array<{
    id: string;
    amount: number;
    note: string | null;
    date: Date;
    createdAt: Date;
  }>;
}

@Injectable()
export class DebtsService {
  constructor(private readonly debtsRepository: DebtsRepository) {}

  async create(userId: string, dto: CreateDebtDto): Promise<EnrichedDebt> {
    const debt = await this.debtsRepository.create({
      personName: dto.personName,
      type: dto.type,
      totalAmount: dto.totalAmount,
      description: dto.description,
      personContact: dto.personContact,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      borrowDate: dto.borrowDate ? new Date(dto.borrowDate) : new Date(),
      userId,
    });

    return this.enrichDebt(debt);
  }

  async findAll(userId: string, type?: string, status?: string): Promise<EnrichedDebt[]> {
    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const debts = await this.debtsRepository.findAll({ where });
    return debts.map((debt) => this.enrichDebt(debt));
  }

  async findById(userId: string, id: string): Promise<EnrichedDebt> {
    const debt = await this.debtsRepository.findById(id);
    if (!debt) {
      throw new NotFoundException('Debt not found');
    }
    if (debt.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.enrichDebt(debt);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateDebtDto,
  ): Promise<EnrichedDebt> {
    await this.findById(userId, id);

    const updateData: Record<string, unknown> = {};
    if (dto.personName !== undefined) updateData.personName = dto.personName;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.totalAmount !== undefined) updateData.totalAmount = dto.totalAmount;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.personContact !== undefined) updateData.personContact = dto.personContact;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.borrowDate !== undefined) updateData.borrowDate = new Date(dto.borrowDate);

    const debt = await this.debtsRepository.update(id, updateData);
    return this.enrichDebt(debt);
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);
    return this.debtsRepository.delete(id);
  }

  async addPayment(
    userId: string,
    debtId: string,
    dto: AddPaymentDto,
  ): Promise<EnrichedDebt> {
    const debt = await this.findById(userId, debtId);

    await this.debtsRepository.addPayment({
      amount: dto.amount,
      note: dto.note,
      date: dto.date ? new Date(dto.date) : new Date(),
      debtId,
    });

    // Update paidAmount and status
    const newPaidAmount = debt.paidAmount + dto.amount;
    const updateData: Record<string, unknown> = {
      paidAmount: newPaidAmount,
    };

    if (newPaidAmount >= debt.totalAmount) {
      updateData.status = 'SETTLED';
      updateData.settledAt = new Date();
    } else if (newPaidAmount > 0) {
      updateData.status = 'PARTIALLY_PAID';
    }

    const updatedDebt = await this.debtsRepository.update(debtId, updateData);
    const fullDebt = await this.debtsRepository.findById(debtId);
    return this.enrichDebt(fullDebt || updatedDebt);
  }

  async getSummary(userId: string) {
    return this.debtsRepository.getSummary(userId);
  }

  private enrichDebt(debt: Debt & { payments?: Array<{ id: string; amount: any; note: string | null; date: Date; createdAt: Date }> }): EnrichedDebt {
    const totalAmount = Number(debt.totalAmount);
    const paidAmount = Number(debt.paidAmount);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const progress = totalAmount > 0
      ? Math.min(Math.round((paidAmount / totalAmount) * 100), 100)
      : 0;

    let isOverdue = false;
    let daysUntilDue: number | null = null;

    if (debt.dueDate && debt.status !== 'SETTLED' && debt.status !== 'CANCELLED') {
      const now = new Date();
      const dueDate = new Date(debt.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isOverdue = daysUntilDue < 0;
    }

    return {
      ...debt,
      totalAmount,
      paidAmount,
      remainingAmount,
      progress,
      isOverdue,
      daysUntilDue,
      payments: debt.payments?.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };
  }
}
