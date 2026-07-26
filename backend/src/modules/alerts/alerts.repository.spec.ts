import { Test, TestingModule } from '@nestjs/testing';
import { AlertsRepository } from './alerts.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('AlertsRepository', () => {
  let repo: AlertsRepository;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      alert: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repo = module.get<AlertsRepository>(AlertsRepository);
    prisma = module.get(PrismaService);
  });

  it('should not recreate a new alert if an unexpired read alert exists', async () => {
    const existingReadAlert = {
      id: 'a1',
      userId: 'u1',
      type: 'GOAL_BEHIND_g1',
      isRead: true,
      expiresAt: new Date(Date.now() + 86400000),
    };
    prisma.alert.findFirst.mockResolvedValue(existingReadAlert);

    const result = await repo.upsertAlert({
      userId: 'u1',
      type: 'GOAL_BEHIND_g1',
      title: 'Goal di Belakang Target',
      message: 'msg',
      severity: 'INFO',
      metadata: { actionUrl: '/goals' },
      expiresAt: new Date(Date.now() + 86400000),
    });

    expect(prisma.alert.create).not.toHaveBeenCalled();
    expect(result).toBe(existingReadAlert);
  });
});
