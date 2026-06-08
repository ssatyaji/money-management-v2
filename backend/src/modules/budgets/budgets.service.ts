import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BudgetsRepository } from './budgets.repository';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly budgetsRepository: BudgetsRepository) {}

  async create(userId: string, dto: CreateBudgetDto) {
    const budget = await this.budgetsRepository.create({
      amount: dto.amount,
      period: dto.period,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate + 'T23:59:59.999Z'),
      categoryId: dto.categoryId,
      alertAt: dto.alertAt ?? 80,
      userId,
    });

    return this.enrichBudgetWithSpent(userId, budget);
  }

  async findAll(userId: string) {
    const budgets = await this.budgetsRepository.findAll({
      where: { userId },
    });

    return Promise.all(
      budgets.map((budget) => this.enrichBudgetWithSpent(userId, budget)),
    );
  }

  async findActiveBudgets(userId: string) {
    const budgets = await this.budgetsRepository.findActiveBudgets(userId);

    return Promise.all(
      budgets.map((budget) => this.enrichBudgetWithSpent(userId, budget)),
    );
  }

  async findById(userId: string, id: string) {
    const budget = await this.budgetsRepository.findById(id);
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    if (budget.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.enrichBudgetWithSpent(userId, budget);
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.findById(userId, id);

    const updateData: Record<string, unknown> = {};
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.period !== undefined) updateData.period = dto.period;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate + 'T23:59:59.999Z');
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.alertAt !== undefined) updateData.alertAt = dto.alertAt;

    const budget = await this.budgetsRepository.update(id, updateData);
    return this.enrichBudgetWithSpent(userId, budget);
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);
    return this.budgetsRepository.delete(id);
  }

  async getSummary(userId: string) {
    const activeBudgets = await this.findActiveBudgets(userId);

    const totalBudget = activeBudgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalSpent = activeBudgets.reduce((sum, b) => sum + (b as any).spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overBudgetCount = activeBudgets.filter((b) => (b as any).spent > Number(b.amount)).length;
    const nearLimitCount = activeBudgets.filter((b) => {
      const pct = ((b as any).spent / Number(b.amount)) * 100;
      return pct >= b.alertAt && pct < 100;
    }).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      activeBudgetCount: activeBudgets.length,
      overBudgetCount,
      nearLimitCount,
      budgets: activeBudgets,
    };
  }

  private async enrichBudgetWithSpent(userId: string, budget: any) {
    const spent = await this.budgetsRepository.calculateSpent(
      userId,
      budget.categoryId,
      new Date(budget.startDate),
      new Date(budget.endDate),
    );

    const percentage = Number(budget.amount) > 0
      ? Math.round((spent / Number(budget.amount)) * 100)
      : 0;

    return {
      ...budget,
      amount: Number(budget.amount),
      spent,
      remaining: Number(budget.amount) - spent,
      percentage,
      isOverBudget: spent > Number(budget.amount),
      isNearLimit: percentage >= budget.alertAt && percentage < 100,
    };
  }
}
