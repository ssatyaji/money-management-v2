import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringFrequency, RecurringTransaction } from '@prisma/client';
import { RecurringTransactionsRepository } from './recurring-transactions.repository';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RecurringTransactionsService {
  private readonly logger = new Logger(RecurringTransactionsService.name);

  constructor(
    private readonly repository: RecurringTransactionsRepository,
    private readonly transactionsService: TransactionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateRecurringTransactionDto) {
    const startDate = new Date(dto.startDate);
    const today = new Date();
    
    // Calculate initial nextDueDate
    let nextDueDate = new Date(startDate);
    if (nextDueDate < today) {
      nextDueDate = this.calculateNextDueDate(nextDueDate, dto.frequency);
      // Keep forwarding until it's today or in the future
      while (nextDueDate < today) {
        nextDueDate = this.calculateNextDueDate(nextDueDate, dto.frequency);
      }
    }

    return this.repository.create({
      amount: dto.amount,
      type: dto.type,
      description: dto.description,
      note: dto.note,
      frequency: dto.frequency,
      startDate,
      nextDueDate,
      categoryId: dto.categoryId,
      accountId: dto.accountId,
      userId,
      isActive: dto.isActive ?? true,
      notifyBeforeDays: dto.notifyBeforeDays,
    });
  }

  async findAll(userId: string) {
    return this.repository.findAll({
      where: { userId },
    });
  }

  async findById(userId: string, id: string) {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundException('Recurring transaction not found');
    }
    if (record.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return record;
  }

  async update(userId: string, id: string, dto: UpdateRecurringTransactionDto) {
    const record = await this.findById(userId, id); // ownership validation

    const updateData: Record<string, any> = {};
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.note !== undefined) updateData.note = dto.note;
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.accountId !== undefined) updateData.accountId = dto.accountId;
    if (dto.notifyBeforeDays !== undefined) updateData.notifyBeforeDays = dto.notifyBeforeDays;

    if (dto.startDate !== undefined) {
      const startDate = new Date(dto.startDate);
      updateData.startDate = startDate;
      
      // Re-calculate nextDueDate based on new startDate and frequency
      const freq = dto.frequency || record.frequency;
      let nextDueDate = new Date(startDate);
      const today = new Date();
      if (nextDueDate < today) {
        nextDueDate = this.calculateNextDueDate(nextDueDate, freq);
        while (nextDueDate < today) {
          nextDueDate = this.calculateNextDueDate(nextDueDate, freq);
        }
      }
      updateData.nextDueDate = nextDueDate;
    } else if (dto.frequency !== undefined) {
      // Re-calculate nextDueDate based on new frequency and existing nextDueDate
      let nextDueDate = new Date(record.nextDueDate);
      const today = new Date();
      if (nextDueDate < today) {
        nextDueDate = this.calculateNextDueDate(nextDueDate, dto.frequency);
        while (nextDueDate < today) {
          nextDueDate = this.calculateNextDueDate(nextDueDate, dto.frequency);
        }
      }
      updateData.nextDueDate = nextDueDate;
    }

    return this.repository.update(id, updateData);
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);
    return this.repository.delete(id);
  }

  calculateNextDueDate(currentDate: Date, frequency: RecurringFrequency): Date {
    const next = new Date(currentDate);

    switch (frequency) {
      case RecurringFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurringFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurringFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case RecurringFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  /**
   * Cron job that runs every day at midnight to process due recurring transactions.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringTransactions() {
    this.logger.log('Checking for due recurring transactions...');
    const dueTransactions = await this.repository.findDue();
    let processedCount = 0;

    for (const record of dueTransactions) {
      try {
        // Create actual transaction
        await this.transactionsService.create(record.userId, {
          amount: Number(record.amount),
          type: record.type,
          description: `[Auto] ${record.description}`,
          note: record.note || `Generated automatically from subscription.`,
          date: new Date().toISOString(),
          categoryId: record.categoryId,
          accountId: record.accountId,
        });

        // Update recurring transaction metadata
        const nextDueDate = this.calculateNextDueDate(record.nextDueDate, record.frequency);
        await this.repository.update(record.id, {
          lastTriggered: new Date(),
          nextDueDate,
        });

        processedCount++;
        this.logger.log(`Triggered recurring transaction "${record.description}" for user ${record.userId}`);
      } catch (error: any) {
        this.logger.error(
          `Failed to process recurring transaction ${record.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Finished processing recurring transactions. Total triggered: ${processedCount}`);
  }

  /**
   * Daily cron job to check for upcoming bill reminders and send push notifications.
   * Runs at 09:00 AM every day.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkAndSendNotifications() {
    this.logger.log('Running daily recurring transactions reminder check...');
    const activeRecurring = await this.repository.findAll({
      where: {
        isActive: true,
        notifyBeforeDays: { not: null },
      },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let sentCount = 0;

    for (const record of activeRecurring) {
      if (record.notifyBeforeDays === null || record.notifyBeforeDays === undefined) continue;

      const nextDueDate = new Date(record.nextDueDate);
      const dueDay = new Date(
        nextDueDate.getFullYear(),
        nextDueDate.getMonth(),
        nextDueDate.getDate(),
      );

      // Calculate how many days left
      const diffTime = dueDay.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Notify if days left matches notifyBeforeDays OR if it's due today (daysLeft === 0)
      if (daysLeft === record.notifyBeforeDays || daysLeft === 0) {
        // Idempotency check: don't send if already sent today
        if (record.lastNotifiedDate) {
          const lastNotified = new Date(record.lastNotifiedDate);
          if (
            lastNotified.getFullYear() === today.getFullYear() &&
            lastNotified.getMonth() === today.getMonth() &&
            lastNotified.getDate() === today.getDate()
          ) {
            continue;
          }
        }

        const amountStr = record.amount
          ? ` (Rp ${Number(record.amount).toLocaleString('id-ID')})`
          : '';
        const dayText = daysLeft === 0 ? 'hari ini' : `dalam ${daysLeft} hari`;

        const payload = {
          title: `Pengingat Tagihan: ${record.description}`,
          body: `Tagihan berulang jatuh tempo ${dayText}${amountStr}. Jangan lupa untuk menyelesaikannya!`,
          url: '/transactions/recurring',
        };

        try {
          await this.notificationsService.sendPushNotification(
            record.userId,
            payload,
          );

          await this.repository.update(record.id, {
            lastNotifiedDate: today,
          });
          sentCount++;
        } catch (error: any) {
          this.logger.error(
            `Failed to send push notification for recurring transaction ${record.id}: ${error.message}`,
          );
        }
      }
    }

    this.logger.log(`Finished checking recurring transactions. Sent ${sentCount} notifications.`);
  }
}
