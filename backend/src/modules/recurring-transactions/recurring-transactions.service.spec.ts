import { Test, TestingModule } from '@nestjs/testing';
import { RecurringFrequency, TransactionType } from '@prisma/client';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { RecurringTransactionsRepository } from './recurring-transactions.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('RecurringTransactionsService', () => {
  let service: RecurringTransactionsService;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findDue: jest.fn(),
  };

  const mockTransactionsService = {
    create: jest.fn(),
  };

  const mockNotificationsService = {
    sendPushNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringTransactionsService,
        { provide: RecurringTransactionsRepository, useValue: mockRepository },
        { provide: TransactionsService, useValue: mockTransactionsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<RecurringTransactionsService>(
      RecurringTransactionsService,
    );
  });

  describe('create', () => {
    it('should convert virtual "main" accountId to null when creating recurring transaction', async () => {
      // Arrange
      const userId = 'user-uuid-1';
      const dto = {
        amount: 193000,
        type: TransactionType.EXPENSE,
        description: 'Netflix',
        frequency: RecurringFrequency.MONTHLY,
        startDate: '2026-12-01T00:00:00.000Z',
        categoryId: 'cat-uuid-1',
        accountId: 'main',
        isActive: true,
        notifyBeforeDays: null,
      };
      mockRepository.create.mockResolvedValue({ id: 'rec-1', ...dto, accountId: null });

      // Act
      await service.create(userId, dto);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          categoryId: 'cat-uuid-1',
          accountId: null,
        }),
      );
    });

    it('should preserve real accountId UUID when creating recurring transaction', async () => {
      // Arrange
      const userId = 'user-uuid-1';
      const dto = {
        amount: 193000,
        type: TransactionType.EXPENSE,
        description: 'Spotify',
        frequency: RecurringFrequency.MONTHLY,
        startDate: '2026-12-01T00:00:00.000Z',
        categoryId: 'cat-uuid-1',
        accountId: 'acc-uuid-1',
        isActive: true,
        notifyBeforeDays: 1,
      };
      mockRepository.create.mockResolvedValue({ id: 'rec-2', ...dto });

      // Act
      await service.create(userId, dto);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'acc-uuid-1',
        }),
      );
    });
  });

  describe('update', () => {
    it('should convert virtual "main" accountId to null when updating recurring transaction', async () => {
      // Arrange
      const userId = 'user-uuid-1';
      mockRepository.findById.mockResolvedValue({
        id: 'rec-1',
        userId,
        frequency: RecurringFrequency.MONTHLY,
        nextDueDate: new Date('2026-12-01T00:00:00.000Z'),
      });
      mockRepository.update.mockResolvedValue({ id: 'rec-1', accountId: null });

      // Act
      await service.update(userId, 'rec-1', { accountId: 'main' });

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        'rec-1',
        expect.objectContaining({
          accountId: null,
        }),
      );
    });
  });

  describe('processRecurringTransactions', () => {
    it('should pass undefined accountId to transactionsService when record.accountId is null', async () => {
      // Arrange
      mockRepository.findDue.mockResolvedValue([
        {
          id: 'rec-1',
          userId: 'user-uuid-1',
          amount: 193000,
          type: TransactionType.EXPENSE,
          description: 'Netflix',
          note: null,
          frequency: RecurringFrequency.MONTHLY,
          nextDueDate: new Date('2026-11-01T00:00:00.000Z'),
          categoryId: 'cat-uuid-1',
          accountId: null,
        },
      ]);
      mockTransactionsService.create.mockResolvedValue({ id: 'tx-1' });
      mockRepository.update.mockResolvedValue({});

      // Act
      await service.processRecurringTransactions();

      // Assert
      expect(mockTransactionsService.create).toHaveBeenCalledWith(
        'user-uuid-1',
        expect.objectContaining({
          categoryId: 'cat-uuid-1',
          accountId: undefined,
        }),
      );
    });
  });
});

