import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ReminderFrequency } from '@prisma/client';
import { RemindersRepository } from './reminders.repository';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(private readonly remindersRepository: RemindersRepository) {}

  async create(userId: string, dto: CreateReminderDto) {
    return this.remindersRepository.create({
      title: dto.title,
      description: dto.description,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      isRecurring: dto.isRecurring ?? false,
      frequency: dto.frequency,
      notifyBefore: dto.notifyBefore ?? 1,
      userId,
    });
  }

  async findAll(userId: string, filter?: 'upcoming' | 'overdue' | 'completed') {
    if (filter === 'upcoming') {
      return this.remindersRepository.findUpcoming(userId, 30);
    }
    if (filter === 'overdue') {
      return this.remindersRepository.findOverdue(userId);
    }
    if (filter === 'completed') {
      return this.remindersRepository.findAll({
        where: { userId, isCompleted: true },
        orderBy: { dueDate: 'desc' },
      });
    }

    // Default: all non-completed reminders
    return this.remindersRepository.findAll({
      where: { userId },
    });
  }

  async findById(userId: string, id: string) {
    const reminder = await this.remindersRepository.findById(id);
    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return reminder;
  }

  async update(userId: string, id: string, dto: UpdateReminderDto) {
    await this.findById(userId, id); // validates ownership

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.isRecurring !== undefined) updateData.isRecurring = dto.isRecurring;
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.notifyBefore !== undefined) updateData.notifyBefore = dto.notifyBefore;

    return this.remindersRepository.update(id, updateData);
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);
    return this.remindersRepository.delete(id);
  }

  async markComplete(userId: string, id: string) {
    const reminder = await this.findById(userId, id);

    // Mark current reminder as completed
    await this.remindersRepository.markComplete(id);

    // If recurring, auto-create next reminder
    if (reminder.isRecurring && reminder.frequency) {
      const nextDueDate = this.calculateNextDueDate(
        reminder.dueDate,
        reminder.frequency,
      );

      await this.remindersRepository.create({
        title: reminder.title,
        description: reminder.description,
        amount: reminder.amount,
        dueDate: nextDueDate,
        isRecurring: true,
        frequency: reminder.frequency,
        notifyBefore: reminder.notifyBefore,
        userId,
      });
    }

    return { message: 'Reminder marked as complete' };
  }

  async getUpcoming(userId: string) {
    return this.remindersRepository.findUpcoming(userId, 7);
  }

  async getOverdue(userId: string) {
    return this.remindersRepository.findOverdue(userId);
  }

  private calculateNextDueDate(currentDate: Date, frequency: ReminderFrequency): Date {
    const next = new Date(currentDate);

    switch (frequency) {
      case ReminderFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case ReminderFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case ReminderFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case ReminderFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }
}
