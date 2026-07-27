import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedTransaction } from '../parsers/base-statement.parser';
import { compressFinancialContext } from '../../ai-advisor/utils/headroom-compressor.util';

@Injectable()
export class AiPdfFallbackParser {
  private readonly logger = new Logger(AiPdfFallbackParser.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('gemini.apiKey') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async parseWithFallback(
    rawPdfText: string,
    bankName: string,
  ): Promise<ParsedTransaction[]> {
    try {
      const compressedText = await compressFinancialContext(rawPdfText);
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      const prompt = `Kamu adalah parser e-statement bank ${bankName} presisi tinggi.
Ekstrak daftar transaksi dari teks e-statement berikut dalam format JSON array TANPA markdown:
[
  {
    "date": "ISO8601 Date String",
    "description": "Deskripsi asli dari PDF",
    "cleanMerchant": "Nama toko/penerima yang bersih",
    "suggestedCategoryName": "Kategori transaksi",
    "amount": 100000,
    "type": "INCOME" atau "EXPENSE"
  }
]

Teks E-Statement:
${compressedText}`;

      const result = await model.generateContent(prompt);
      const cleanedText = result
        .response.text()
        .replace(/\`\`\`json\n?/g, '')
        .replace(/\`\`\`\n?/g, '')
        .trim();

      const items = JSON.parse(cleanedText);
      if (!Array.isArray(items)) return [];

      return items.map((item: any, index: number) => ({
        tempId: `ai-${Date.now()}-${index}`,
        date: new Date(item.date),
        description: item.cleanMerchant
          ? `${item.description} (${item.cleanMerchant})`
          : item.description,
        amount: Number(item.amount),
        type: item.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      }));
    } catch (error) {
      this.logger.error(
        `AI Fallback parsing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }
}
