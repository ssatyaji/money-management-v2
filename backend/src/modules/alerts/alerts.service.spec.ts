import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { AlertsRepository } from './alerts.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let repo: jest.Mocked<AlertsRepository>;

  beforeEach(async () => {
    const mockRepo = {
      findActiveByUser: jest.fn(),
      upsertAlert: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteExpired: jest.fn(),
    };
    const mockPrisma = {
      budget: { findMany: jest.fn().mockResolvedValue([]) },
      debt: { findMany: jest.fn().mockResolvedValue([]) },
      savingGoal: { findMany: jest.fn().mockResolvedValue([]) },
      account: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      transaction: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }), groupBy: jest.fn().mockResolvedValue([]) },
      alert: { deleteMany: jest.fn(), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: AlertsRepository, useValue: mockRepo },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    repo = module.get(AlertsRepository);
  });

  it('should map actionUrl and actionLabel from metadata in getActiveAlerts', async () => {
    repo.findActiveByUser.mockResolvedValue([
      {
        id: 'alert-1',
        userId: 'u-1',
        type: 'GOAL_BEHIND_g1',
        title: 'Goal di Belakang Target',
        message: 'Tabungan "Rumah" baru 20%',
        severity: 'INFO',
        metadata: { goalId: 'g1', actionUrl: '/saving-goals', actionLabel: 'Setor Tabungan' },
        isRead: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      } as any,
    ]);

    const res = await service.getActiveAlerts('u-1');
    expect(res[0].actionUrl).toBe('/saving-goals');
    expect(res[0].actionLabel).toBe('Setor Tabungan');
  });
});
