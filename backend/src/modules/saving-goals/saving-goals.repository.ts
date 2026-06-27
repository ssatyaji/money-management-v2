import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, SavingGoal, GoalContribution } from '@prisma/client';

@Injectable()
export class SavingGoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SavingGoalUncheckedCreateInput): Promise<SavingGoal> {
    return this.prisma.savingGoal.create({ data });
  }

  async findAll(params: {
    where?: Prisma.SavingGoalWhereInput;
    orderBy?: Prisma.SavingGoalOrderByWithRelationInput;
  }): Promise<SavingGoal[]> {
    return this.prisma.savingGoal.findMany({
      where: params.where,
      orderBy: params.orderBy || { createdAt: 'desc' },
      include: {
        contributions: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.savingGoal.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.SavingGoalUncheckedUpdateInput,
  ): Promise<SavingGoal> {
    return this.prisma.savingGoal.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<SavingGoal> {
    return this.prisma.savingGoal.delete({ where: { id } });
  }

  async addContribution(data: Prisma.GoalContributionUncheckedCreateInput): Promise<GoalContribution> {
    return this.prisma.goalContribution.create({ data });
  }

  async getSummary(userId: string) {
    const goals = await this.prisma.savingGoal.findMany({
      where: { userId },
    });

    const totalGoals = goals.length;
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE').length;
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
    const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      totalTarget,
      totalSaved,
      overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
    };
  }
}
