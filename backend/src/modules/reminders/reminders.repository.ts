import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Reminder } from '@prisma/client';

@Injectable()
export class RemindersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ReminderUncheckedCreateInput): Promise<Reminder> {
    return this.prisma.reminder.create({ data });
  }

  async findAll(params: {
    where?: Prisma.ReminderWhereInput;
    orderBy?: Prisma.ReminderOrderByWithRelationInput;
  }): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: params.where,
      orderBy: params.orderBy || { dueDate: 'asc' },
    });
  }

  async findById(id: string): Promise<Reminder | null> {
    return this.prisma.reminder.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.ReminderUncheckedUpdateInput): Promise<Reminder> {
    return this.prisma.reminder.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Reminder> {
    return this.prisma.reminder.delete({ where: { id } });
  }

  async findUpcoming(userId: string, days: number = 7): Promise<Reminder[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.reminder.findMany({
      where: {
        userId,
        isCompleted: false,
        dueDate: { gte: now, lte: futureDate },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOverdue(userId: string): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: {
        userId,
        isCompleted: false,
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async markComplete(id: string): Promise<Reminder> {
    return this.prisma.reminder.update({
      where: { id },
      data: { isCompleted: true },
    });
  }
}
