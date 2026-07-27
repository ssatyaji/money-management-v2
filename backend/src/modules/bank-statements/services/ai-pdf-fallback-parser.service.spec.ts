import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiPdfFallbackParser } from './ai-pdf-fallback-parser.service';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(
            JSON.stringify([
              {
                date: '2026-07-10T00:00:00.000Z',
                description: 'TRSF E-BANKING CR 10/07 12345/JAGO',
                cleanMerchant: 'Transfer ke Bank Jago',
                suggestedCategoryName: 'Transfer Out',
                amount: 1000000,
                type: 'EXPENSE',
              },
            ]),
          ),
        },
      }),
    }),
  })),
}));

describe('AiPdfFallbackParser', () => {
  let service: AiPdfFallbackParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiPdfFallbackParser,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('fake-key') },
        },
      ],
    }).compile();

    service = module.get<AiPdfFallbackParser>(AiPdfFallbackParser);
  });

  it('should parse raw PDF text using Gemini AI fallback', async () => {
    // Arrange
    const rawPdfText = 'RAW UNPARSED BANK STATEMENT TEXT PERMATA...';

    // Act
    const result = await service.parseWithFallback(rawPdfText, 'PERMATA');

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].amount).toBe(1000000);
    expect(result[0].description).toContain('TRSF E-BANKING CR');
  });
});
