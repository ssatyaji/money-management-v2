/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OcrParserService, ParsedReceipt } from './ocr-parser.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly ocrParser: OcrParserService,
  ) {
    this.uploadDir = this.configService.get<string>(
      'storage.uploadDir',
      './uploads',
    );
  }

  /**
   * Process an uploaded receipt image via Tesseract.js OCR.
   * Saves the file, runs OCR, parses the result, and stores
   * the BankStatement record (repurposed for OCR receipts with bankName metadata).
   */
  async processReceipt(
    userId: string,
    file: Express.Multer.File,
    description?: string,
  ): Promise<{ id: string; result: ParsedReceipt }> {
    // Ensure upload directory exists
    const receiptDir = path.join(this.uploadDir, 'receipts');
    if (!fs.existsSync(receiptDir)) {
      fs.mkdirSync(receiptDir, { recursive: true });
    }

    // Save file
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(receiptDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    this.logger.log(`Receipt saved: ${filePath}`);

    // Run OCR with Tesseract.js
    let rawText: string;
    try {
      // Dynamic import for Tesseract.js (ESM module)
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('ind+eng');
      const { data } = await worker.recognize(filePath);
      rawText = data.text;
      await worker.terminate();
    } catch (error: any) {
      this.logger.error(`OCR processing failed: ${error.message}`, error.stack);
      // Clean up file on failure
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new BadRequestException(
        'Gagal memproses gambar struk. Pastikan gambar jelas dan tidak blur.',
      );
    }

    // Parse the OCR text
    const parsed = this.ocrParser.parseReceiptText(rawText);

    // Store the result in a simple JSON structure
    // We'll use a lightweight approach: store in memory/return directly
    // For persistence, we create a record to track the upload
    const record = await this.prisma.bankStatement.create({
      data: {
        fileName: file.originalname,
        filePath: filePath,
        bankName: 'PERMATA', // Placeholder — OCR doesn't have a bank
        status: 'COMPLETED',
        processedAt: new Date(),
        userId,
        // We store parsed data in errorMessage field as JSON (pragmatic approach)
        // In a production app, you'd have a dedicated OcrResult table
        errorMessage: JSON.stringify({
          type: 'OCR_RECEIPT',
          description: description || null,
          result: parsed,
        }),
      },
    });

    this.logger.log(`OCR completed for receipt ${record.id}`);

    return { id: record.id, result: parsed };
  }

  /**
   * Get OCR processing status by ID.
   */
  async getStatus(userId: string, id: string) {
    const record = await this.prisma.bankStatement.findFirst({
      where: { id, userId },
      select: { id: true, status: true, processedAt: true, fileName: true },
    });

    if (!record) {
      throw new NotFoundException('Record tidak ditemukan');
    }

    return record;
  }

  /**
   * Get OCR result by ID.
   */
  async getResult(userId: string, id: string) {
    const record = await this.prisma.bankStatement.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new NotFoundException('Record tidak ditemukan');
    }

    if (record.status !== 'COMPLETED' || !record.errorMessage) {
      throw new BadRequestException('Hasil OCR belum tersedia');
    }

    try {
      const data = JSON.parse(record.errorMessage);
      if (data.type !== 'OCR_RECEIPT') {
        throw new BadRequestException('Record ini bukan hasil OCR');
      }
      return {
        id: record.id,
        fileName: record.fileName,
        status: record.status,
        processedAt: record.processedAt,
        result: data.result as ParsedReceipt,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Gagal membaca hasil OCR');
    }
  }
}
