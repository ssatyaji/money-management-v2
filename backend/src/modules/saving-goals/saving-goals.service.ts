import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SavingGoalsRepository } from './saving-goals.repository';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto';
import { AddContributionDto } from './dto/add-contribution.dto';
import { CompleteGoalDto } from './dto/complete-goal.dto';
import { SavingGoal } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';

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
  constructor(
    private readonly savingGoalsRepository: SavingGoalsRepository,
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

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

    if (goal.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot add contribution to a non-active goal');
    }

    // Validate source account balance
    const sourceAccount = await this.accountsService.findById(userId, dto.accountId);
    if (dto.amount > sourceAccount.balance) {
      throw new BadRequestException(
        `Insufficient funds in "${sourceAccount.name}". Available: Rp ${sourceAccount.balance.toLocaleString('id-ID')}`,
      );
    }

    // Find or create transfer category
    let transferCat = await this.prisma.category.findFirst({
      where: {
        type: 'TRANSFER',
        OR: [{ userId: null }, { userId }],
      },
    });
    if (!transferCat) {
      transferCat = await this.prisma.category.create({
        data: {
          name: 'Transfer',
          icon: '🔄',
          color: '#6366f1',
          type: 'TRANSFER',
          isDefault: true,
        },
      });
    }

    const contributionDate = dto.date ? new Date(dto.date) : new Date();

    // Atomic: create transaction + contribution + update goal
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create TRANSFER transaction (wallet → goal virtual pool)
      const transaction = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: 'TRANSFER',
          description: `Tabungan: ${goal.name}`,
          date: contributionDate,
          categoryId: transferCat!.id,
          accountId: dto.accountId === 'main' ? null : dto.accountId,
          destinationAccountId: null, // no destination wallet (goes to goal pool)
          savingGoalId: goalId,
          userId,
          source: 'MANUAL',
        },
      });

      // 2. Create contribution record linked to transaction + account
      await tx.goalContribution.create({
        data: {
          amount: dto.amount,
          note: dto.note,
          date: contributionDate,
          goalId,
          accountId: dto.accountId === 'main' ? null : dto.accountId,
          transactionId: transaction.id,
        },
      });

      // 3. Update goal currentAmount
      const newCurrentAmount = goal.currentAmount + dto.amount;
      const updateData: Record<string, unknown> = {
        currentAmount: newCurrentAmount,
      };

      // Auto-complete if target reached
      if (newCurrentAmount >= goal.targetAmount) {
        updateData.status = 'COMPLETED';
        updateData.completedAt = new Date();
      }

      return tx.savingGoal.update({
        where: { id: goalId },
        data: updateData,
      });
    });

    const fullGoal = await this.savingGoalsRepository.findById(goalId);
    return this.enrichGoal(fullGoal || result);
  }

  async completeGoal(
    userId: string,
    goalId: string,
    dto: CompleteGoalDto,
  ): Promise<EnrichedSavingGoal> {
    const goal = await this.findById(userId, goalId);

    if (goal.status !== 'COMPLETED' && goal.status !== 'ACTIVE') {
      throw new BadRequestException('Goal is already cancelled');
    }

    if (goal.currentAmount <= 0) {
      throw new BadRequestException('No funds to withdraw or spend');
    }

    if (dto.action === 'WITHDRAW') {
      // Transfer funds back to a wallet
      // Validate target is a valid account
      await this.accountsService.findById(userId, dto.targetId);

      let transferCat = await this.prisma.category.findFirst({
        where: {
          type: 'TRANSFER',
          OR: [{ userId: null }, { userId }],
        },
      });
      if (!transferCat) {
        transferCat = await this.prisma.category.create({
          data: {
            name: 'Transfer',
            icon: '🔄',
            color: '#6366f1',
            type: 'TRANSFER',
            isDefault: true,
          },
        });
      }

      await this.prisma.$transaction(async (tx) => {
        // Create TRANSFER: goal pool → wallet
        await tx.transaction.create({
          data: {
            amount: goal.currentAmount,
            type: 'TRANSFER',
            description: `Pencairan goal: ${goal.name}`,
            date: new Date(),
            categoryId: transferCat!.id,
            accountId: null, // from goal virtual pool (no source wallet)
            destinationAccountId: dto.targetId === 'main' ? null : dto.targetId,
            savingGoalId: goalId,
            userId,
            source: 'MANUAL',
          },
        });

        // Reset goal amount and mark completed
        await tx.savingGoal.update({
          where: { id: goalId },
          data: {
            currentAmount: 0,
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      });
    } else if (dto.action === 'SPEND') {
      // Create EXPENSE from goal pool to a category
      // Validate target is a valid category
      const category = await this.prisma.category.findUnique({
        where: { id: dto.targetId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      await this.prisma.$transaction(async (tx) => {
        // Create EXPENSE transaction
        await tx.transaction.create({
          data: {
            amount: goal.currentAmount,
            type: 'EXPENSE',
            description: `Belanja goal: ${goal.name}`,
            date: new Date(),
            categoryId: dto.targetId,
            accountId: null,
            savingGoalId: goalId,
            userId,
            source: 'MANUAL',
          },
        });

        // Reset goal amount and mark completed
        await tx.savingGoal.update({
          where: { id: goalId },
          data: {
            currentAmount: 0,
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      });
    }

    const fullGoal = await this.savingGoalsRepository.findById(goalId);
    return this.enrichGoal(fullGoal!);
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

