import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BankStatementsService } from './bank-statements.service';
import { BankStatementsRepository } from './bank-statements.repository';
import { ParserFactory } from './parsers/parser.factory';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { AiPdfFallbackParser } from './services/ai-pdf-fallback-parser.service';
import { AiTransactionDeduplicator } from './services/ai-transaction-deduplicator.service';

describe('BankStatementsService - IDOR Prevention Tests', () => {
  let service: BankStatementsService;
  let repository: jest.Mocked<BankStatementsRepository>;
  let accountsService: jest.Mocked<AccountsService>;

  const userId = 'user-owner-uuid';
  const statementId = 'stmt-123';

  beforeEach(async () => {
    const mockRepository = {
      findOneByUser: jest.fn(),
      findAllByUser: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      createTransactions: jest.fn(),
    };

    const mockAccountsService = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockParserFactory = {
      getParser: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('./uploads'),
    };

    const mockPrismaService = {
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cat-default-id' }),
      },
    };

    const mockAiPdfFallbackParser = {
      parseWithFallback: jest.fn().mockResolvedValue([]),
    };

    const mockAiDeduplicator = {
      matchDuplicatesAndTransfers: jest
        .fn()
        .mockImplementation((_userId, txns) => Promise.resolve(txns)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankStatementsService,
        { provide: BankStatementsRepository, useValue: mockRepository },
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: ParserFactory, useValue: mockParserFactory },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AiPdfFallbackParser, useValue: mockAiPdfFallbackParser },
        { provide: AiTransactionDeduplicator, useValue: mockAiDeduplicator },
      ],
    }).compile();

    service = module.get<BankStatementsService>(BankStatementsService);
    repository = module.get(BankStatementsRepository);
    accountsService = module.get(AccountsService);
  });

  it('should allow import when mapped account belongs to the user', async () => {
    repository.findOneByUser.mockResolvedValue({
      id: statementId,
      userId,
      status: 'COMPLETED',
      fileName: 'test.pdf',
      filePath: '/tmp/test.pdf',
      bankName: 'JAGO',
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
      errorMessage: null,
    });

    jest.spyOn(service, 'getTransactions').mockResolvedValue([
      {
        tempId: 'txn-1',
        date: new Date(),
        description: 'Test Txn',
        amount: 10000,
        type: 'EXPENSE',
      },
    ]);

    accountsService.findById.mockResolvedValue({
      id: 'valid-account-id',
      name: 'My Wallet',
      color: '#000',
      startingBalance: new Object() as any,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      balance: 100000,
    });

    repository.createTransactions.mockResolvedValue({ count: 1 });

    const result = await service.importTransactions(userId, statementId, {
      transactionIds: ['txn-1'],
      accountId: 'valid-account-id',
    });

    expect(result.imported).toBe(1);
    expect(accountsService.findById).toHaveBeenCalledWith(userId, 'valid-account-id');
  });

  it('should reject import when mapped account belongs to another user (ForbiddenException)', async () => {
    repository.findOneByUser.mockResolvedValue({
      id: statementId,
      userId,
      status: 'COMPLETED',
      fileName: 'test.pdf',
      filePath: '/tmp/test.pdf',
      bankName: 'JAGO',
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
      errorMessage: null,
    });

    jest.spyOn(service, 'getTransactions').mockResolvedValue([
      {
        tempId: 'txn-1',
        date: new Date(),
        description: 'Test Txn',
        amount: 10000,
        type: 'EXPENSE',
      },
    ]);

    accountsService.findById.mockRejectedValue(
      new ForbiddenException('Access denied'),
    );

    const victimAccountId = 'victim-account-id';

    await expect(
      service.importTransactions(userId, statementId, {
        transactionIds: ['txn-1'],
        accountId: victimAccountId,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(accountsService.findById).toHaveBeenCalledWith(userId, victimAccountId);
  });
});
