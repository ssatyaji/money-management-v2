import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderFrequency } from '@prisma/client';
import { RemindersRepository } from './reminders.repository';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

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

  /**
   * Daily cron job to check for upcoming reminders and send push notifications.
   * Runs at 09:00 AM every day.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkAndSendPushNotifications() {
    this.logger.log('Running daily reminder push notification check...');
    
    // Find all incomplete reminders
    // We fetch a wide net because we want to check notifyBefore condition
    const reminders = await this.remindersRepository.findAll({
      where: { isCompleted: false },
    });

    const now = new Date();
    // Reset time for comparison (only care about dates)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let sentCount = 0;

    for (const reminder of reminders) {
      const dueDate = new Date(reminder.dueDate);
      const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      // Calculate how many days left
      const diffTime = dueDay.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Notify if today is exactly (notifyBefore) days before the due date,
      // or if it's due today (daysLeft === 0), or overdue but we might want to remind again.
      // For simplicity, we send if daysLeft is exactly notifyBefore OR exactly 0.
      if (daysLeft === reminder.notifyBefore || daysLeft === 0) {
        const amountStr = reminder.amount ? ` (Rp ${reminder.amount})` : '';
        const dayText = daysLeft === 0 ? 'hari ini' : `dalam ${daysLeft} hari`;
        
        const payload = {
          title: `Pengingat: ${reminder.title}`,
          body: `Jatuh tempo ${dayText}${amountStr}. Jangan lupa untuk menyelesaikannya!`,
          url: '/reminders',
        };

        await this.notificationsService.sendPushNotification(reminder.userId, payload);
        sentCount++;
      }
    }

    this.logger.log(`Sent ${sentCount} reminder push notifications.`);
  }
}
