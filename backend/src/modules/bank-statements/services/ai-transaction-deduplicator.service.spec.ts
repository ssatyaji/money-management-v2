import { Test, TestingModule } from '@nestjs/testing';
import { AiTransactionDeduplicator } from './ai-transaction-deduplicator.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AiTransactionDeduplicator', () => {
  let service: AiTransactionDeduplicator;
  let prisma: any;

  const mockPrisma = {
    transaction: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiTransactionDeduplicator,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AiTransactionDeduplicator>(
      AiTransactionDeduplicator,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should flag inter-account transfers when matching amount and date window exist with transfer keyword', async () => {
    // Arrange
    const userId = 'user-123';
    const parsedTxns = [
      {
        tempId: 'temp-1',
        date: new Date('2026-07-10T10:00:00Z'),
        description: 'TRSF E-BANKING CR JAGO Rp 1.000.000',
        amount: 1000000,
        type: 'EXPENSE' as const,
      },
    ];

    mockPrisma.transaction.findMany.mockResolvedValue([
      {
        id: 'existing-tx-1',
        date: new Date('2026-07-11T12:00:00Z'),
        amount: 1000000,
        type: 'INCOME',
        account: { name: 'Bank Jago' },
        description: 'Transfer dari Bank Permata',
      },
    ]);

    // Act
    const enriched = await service.matchDuplicatesAndTransfers(
      userId,
      parsedTxns,
    );

    // Assert
    expect(enriched[0].isInterAccountTransfer).toBe(true);
    expect(enriched[0].matchedTransactionId).toBe('existing-tx-1');
    expect(enriched[0].matchedAccountName).toBe('Bank Jago');
  });

  it('should flag duplicate transaction when exact amount and close date exist', async () => {
    // Arrange
    const userId = 'user-123';
    const parsedTxns = [
      {
        tempId: 'temp-2',
        date: new Date('2026-07-10T10:00:00Z'),
        description: 'Pembelian Tokopedia',
        amount: 50000,
        type: 'EXPENSE' as const,
      },
    ];

    mockPrisma.transaction.findMany.mockResolvedValue([
      {
        id: 'existing-tx-2',
        date: new Date('2026-07-10T10:00:00Z'),
        amount: 50000,
        type: 'EXPENSE',
        account: { name: 'Bank Permata' },
        description: 'Pembelian Tokopedia',
      },
    ]);

    // Act
    const enriched = await service.matchDuplicatesAndTransfers(
      userId,
      parsedTxns,
    );

    // Assert
    expect(enriched[0].isPossibleDuplicate).toBe(true);
    expect(enriched[0].matchedTransactionId).toBe('existing-tx-2');
  });
});
