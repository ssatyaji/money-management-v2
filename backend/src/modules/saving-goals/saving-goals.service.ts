import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SavingGoalsRepository } from './saving-goals.repository';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto';
import { AddContributionDto } from './dto/add-contribution.dto';
import { SavingGoal } from '@prisma/client';

export interface EnrichedSavingGoal extends Omit<SavingGoal, 'targetAmount' | 'currentAmount' | 'monthlyTarget'> {
  targetAmount: number;
  currentAmount: number;
  monthlyTarget: number | null;
  progress: number;
  remainingAmount: number;
  suggestedMonthly: number | null;
  daysRemaining: number | null;
  contributions?: Array<{
    id: string;
    amount: number;
    note: string | null;
    date: Date;
    createdAt: Date;
  }>;
}

@Injectable()
export class SavingGoalsService {
  constructor(private readonly savingGoalsRepository: SavingGoalsRepository) {}

  async create(userId: string, dto: CreateSavingGoalDto): Promise<EnrichedSavingGoal> {
    const goal = await this.savingGoalsRepository.create({
      name: dto.name,
      goalType: dto.goalType,
      targetAmount: dto.targetAmount,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      monthlyTarget: dto.monthlyTarget,
      userId,
    });

    return this.enrichGoal(goal);
  }

  async findAll(userId: string): Promise<EnrichedSavingGoal[]> {
    const goals = await this.savingGoalsRepository.findAll({
      where: { userId },
    });

    return goals.map((goal) => this.enrichGoal(goal));
  }

  async findById(userId: string, id: string): Promise<EnrichedSavingGoal> {
    const goal = await this.savingGoalsRepository.findById(id);
    if (!goal) {
      throw new NotFoundException('Saving goal not found');
    }
    if (goal.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.enrichGoal(goal);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateSavingGoalDto,
  ): Promise<EnrichedSavingGoal> {
    await this.findById(userId, id);

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.goalType !== undefined) updateData.goalType = dto.goalType;
    if (dto.targetAmount !== undefined) updateData.targetAmount = dto.targetAmount;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.deadline !== undefined) updateData.deadline = new Date(dto.deadline);
    if (dto.monthlyTarget !== undefined) updateData.monthlyTarget = dto.monthlyTarget;

    const goal = await this.savingGoalsRepository.update(id, updateData);
    return this.enrichGoal(goal);
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);
    return this.savingGoalsRepository.delete(id);
  }

  async addContribution(
    userId: string,
    goalId: string,
    dto: AddContributionDto,
  ): Promise<EnrichedSavingGoal> {
    const goal = await this.findById(userId, goalId);

    await this.savingGoalsRepository.addContribution({
      amount: dto.amount,
      note: dto.note,
      date: dto.date ? new Date(dto.date) : new Date(),
      goalId,
    });

    // Update currentAmount
    const newCurrentAmount = goal.currentAmount + dto.amount;
    const updateData: Record<string, unknown> = {
      currentAmount: newCurrentAmount,
    };

    // Auto-complete if target reached
    if (newCurrentAmount >= goal.targetAmount) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    const updatedGoal = await this.savingGoalsRepository.update(goalId, updateData);
    const fullGoal = await this.savingGoalsRepository.findById(goalId);
    return this.enrichGoal(fullGoal || updatedGoal);
  }

  async getSummary(userId: string) {
    return this.savingGoalsRepository.getSummary(userId);
  }

  private enrichGoal(goal: SavingGoal & { contributions?: Array<{ id: string; amount: any; note: string | null; date: Date; createdAt: Date }> }): EnrichedSavingGoal {
    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const monthlyTarget = goal.monthlyTarget ? Number(goal.monthlyTarget) : null;

    const progress = targetAmount > 0
      ? Math.min(Math.round((currentAmount / targetAmount) * 100), 100)
      : 0;

    const remainingAmount = Math.max(targetAmount - currentAmount, 0);

    // Calculate suggested monthly
    let suggestedMonthly: number | null = null;
    let daysRemaining: number | null = null;

    if (goal.deadline && goal.status === 'ACTIVE') {
      const now = new Date();
      const deadline = new Date(goal.deadline);
      const diffTime = deadline.getTime() - now.getTime();
      daysRemaining = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
      const monthsRemaining = Math.max(daysRemaining / 30, 1);
      suggestedMonthly = remainingAmount > 0
        ? Math.ceil(remainingAmount / monthsRemaining)
        : 0;
    }

    return {
      ...goal,
      targetAmount,
      currentAmount,
      monthlyTarget,
      progress,
      remainingAmount,
      suggestedMonthly,
      daysRemaining,
      contributions: goal.contributions?.map((c) => ({
        ...c,
        amount: Number(c.amount),
      })),
    };
  }
}
