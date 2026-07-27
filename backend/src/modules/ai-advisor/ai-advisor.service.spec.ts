import { Test, TestingModule } from '@nestjs/testing';
import { AiAdvisorService } from './ai-advisor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { compressFinancialContext } from './utils/headroom-compressor.util';

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue('Saran keuangan dari AI.'),
          },
        }),
      }),
    })),
  };
});

describe('AiAdvisorService with Headroom Compression', () => {
  let service: AiAdvisorService;
  let prismaService: any;

  const mockPrismaService = {
    aiChatSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    aiChatMessage: {
      create: jest.fn(),
    },
    aiInsight: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ startingBalance: 1000000 }),
    },
    account: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    transaction: {
      groupBy: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
    savingGoal: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    debt: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('fake-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAdvisorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiAdvisorService>(AiAdvisorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('compressFinancialContext utility', () => {
    it('should return raw context if context is short', async () => {
      // Arrange
      const shortContext = 'Saldo: Rp1.000.000';

      // Act
      const result = await compressFinancialContext(shortContext);

      // Assert
      expect(result).toBe(shortContext);
    });

    it('should handle raw context compression gracefully without crashing', async () => {
      // Arrange
      const longContext = 'Saldo: Rp10.000.000\nPemasukan bulan ini: Rp5.000.000\nPengeluaran bulan ini: Rp2.000.000\nTop kategori: Makanan(Rp1.000.000), Transport(Rp500.000)\nGoals: Tabungan Rumah(50%)\nUtang: Tidak ada';

      // Act
      const result = await compressFinancialContext(longContext);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('sendMessage', () => {
    it('should process user message and pass compressed context to Gemini API', async () => {
      // Arrange
      const userId = 'user-1';
      const sessionId = 'session-1';
      const userMessage = 'Bagaimana tips hemat bulan ini?';

      mockPrismaService.aiChatSession.findFirst.mockResolvedValue({
        id: sessionId,
        userId,
        context: 'GENERAL',
        contextId: null,
      });

      // Act
      const response = await service.sendMessage(userId, sessionId, userMessage);

      // Assert
      expect(response).toEqual({
        role: 'assistant',
        content: 'Saran keuangan dari AI.',
      });
      expect(mockPrismaService.aiChatMessage.create).toHaveBeenLastCalledWith({
        data: {
          sessionId,
          role: 'assistant',
          content: 'Saran keuangan dari AI.',
        },
      });
    });
  });
});
