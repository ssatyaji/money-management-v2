/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BankName } from '@prisma/client';
import { BankStatementsRepository } from './bank-statements.repository';
import { ParserFactory } from './parsers/parser.factory';
import {
  ParsedStatement,
  ParsedTransaction,
} from './parsers/base-statement.parser';
import { ImportTransactionsDto } from './dto/import-transactions.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PDFParse } from 'pdf-parse';
import * as path from 'path';
import * as fs from 'fs';

import { AccountsService } from '../accounts/accounts.service';

/**
 * Extract text from a PDF buffer using pdf-parse v2.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
  const result = await parser.getText();
  return result.text;
}

@Injectable()
export class BankStatementsService {
  private readonly logger = new Logger(BankStatementsService.name);
  private readonly uploadDir: string;

  // In-memory cache for parsed results (keyed by statement ID)
  // In production, this would be stored in Redis or database
  private readonly parsedResultsCache = new Map<string, ParsedStatement>();

  constructor(
    private readonly repository: BankStatementsRepository,
    private readonly parserFactory: ParserFactory,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {
    this.uploadDir = this.configService.get<string>(
      'storage.uploadDir',
      './uploads',
    );
  }

  /**
   * Upload and parse a bank statement PDF.
   */
  async upload(userId: string, bankName: BankName, file: Express.Multer.File) {
    // Ensure upload directory exists
    const statementsDir = path.join(this.uploadDir, 'statements');
    if (!fs.existsSync(statementsDir)) {
      fs.mkdirSync(statementsDir, { recursive: true });
    }

    // Save file
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(statementsDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Create record
    const record = await this.repository.create({
      fileName: file.originalname,
      filePath,
      bankName,
      userId,
      status: 'PROCESSING',
    });

    this.logger.log(`Bank statement uploaded: ${record.id} (${bankName})`);

    // Parse PDF
    try {
      const text = await extractPdfText(file.buffer);

      // Get the appropriate parser
      const parser = this.parserFactory.getParser(bankName);

      // Parse the text
      const result = await parser.parse(text);

      // Cache the parsed result
      this.parsedResultsCache.set(record.id, result);

      // Update record status
      await this.repository.updateStatus(record.id, 'COMPLETED', {
        processedAt: new Date(),
        statementDate: result.statementDate,
        // Store transaction count in errorMessage for reference
        errorMessage: JSON.stringify({
          type: 'BANK_STATEMENT',
          transactionCount: result.transactions.length,
          accountNumber: result.accountNumber,
          accountHolder: result.accountHolder,
        }),
      });

      this.logger.log(
        `Parsed ${result.transactions.length} transactions from ${bankName} statement`,
      );

      return {
        id: record.id,
        fileName: file.originalname,
        bankName,
        status: 'COMPLETED',
        transactionCount: result.transactions.length,
        statementDate: result.statementDate,
        accountNumber: result.accountNumber,
      };
    } catch (error) {
      this.logger.error(
        `Failed to parse statement: ${error.message}`,
        error.stack,
      );

      await this.repository.updateStatus(record.id, 'FAILED', {
        errorMessage: `Gagal parsing: ${error.message}`,
      });

      throw new BadRequestException(
        'Gagal mem-parsing file PDF. Pastikan file adalah e-statement yang valid dan tidak rusak.',
      );
    }
  }

  /**
   * Get all bank statements for a user.
   */
  async findAll(userId: string) {
    return this.repository.findAllByUser(userId);
  }

  /**
   * Get a single bank statement by ID.
   */
  async findOne(userId: string, id: string) {
    const record = await this.repository.findOneByUser(userId, id);
    if (!record) {
      throw new NotFoundException('Bank statement tidak ditemukan');
    }
    return record;
  }

  /**
   * Get parsed transactions from a processed bank statement.
   */
  async getTransactions(
    userId: string,
    id: string,
  ): Promise<ParsedTransaction[]> {
    const record = await this.repository.findOneByUser(userId, id);
    if (!record) {
      throw new NotFoundException('Bank statement tidak ditemukan');
    }

    if (record.status !== 'COMPLETED') {
      throw new BadRequestException('Bank statement belum selesai diproses');
    }

    // Check cache first
    const cached = this.parsedResultsCache.get(id);
    if (cached) {
      return cached.transactions;
    }

    // Re-parse if not in cache (e.g., after server restart)
    try {
      const fileBuffer = fs.readFileSync(record.filePath);
      const text = await extractPdfText(fileBuffer);

      const parser = this.parserFactory.getParser(record.bankName);
      const result = await parser.parse(text);

      // Re-cache
      this.parsedResultsCache.set(id, result);

      return result.transactions;
    } catch (error) {
      this.logger.error(`Failed to re-parse statement: ${error.message}`);
      throw new BadRequestException('Gagal membaca data transaksi dari file');
    }
  }

  /**
   * Import selected parsed transactions into the Transaction table.
   */
  async importTransactions(
    userId: string,
    id: string,
    dto: ImportTransactionsDto,
  ) {
    const record = await this.repository.findOneByUser(userId, id);
    if (!record) {
      throw new NotFoundException('Bank statement tidak ditemukan');
    }

    if (record.status !== 'COMPLETED') {
      throw new BadRequestException('Bank statement belum selesai diproses');
    }

    // Get parsed transactions
    const allTransactions = await this.getTransactions(userId, id);
    const selectedTxns = allTransactions.filter((txn) =>
      dto.transactionIds.includes(txn.tempId),
    );

    if (selectedTxns.length === 0) {
      throw new BadRequestException(
        'Tidak ada transaksi yang dipilih untuk diimport',
      );
    }

    // Validate wallet/account ownership for all target account IDs
    const targetAccountIds = new Set<string>();
    if (dto.accountId && dto.accountId !== 'main') {
      targetAccountIds.add(dto.accountId);
    }
    if (dto.accountMap) {
      Object.values(dto.accountMap).forEach((accId) => {
        if (accId && accId !== 'main') {
          targetAccountIds.add(accId);
        }
      });
    }

    for (const targetAccId of targetAccountIds) {
      await this.accountsService.findById(userId, targetAccId);
    }

    // Get a default category for uncategorized transactions
    const defaultCategory = await this.prisma.category.findFirst({
      where: {
        OR: [
          { isDefault: true, type: 'EXPENSE' },
          { userId: null, type: 'EXPENSE' },
        ],
      },
    });

    if (!defaultCategory) {
      throw new BadRequestException(
        'Tidak ada kategori default. Silakan buat kategori terlebih dahulu.',
      );
    }

    // Build transaction data
    const transactionData = selectedTxns.map((txn) => {
      const mappedAccountId = dto.accountMap?.[txn.tempId] || dto.accountId;
      return {
        amount: txn.amount,
        type: txn.type,
        description: txn.description,
        date: txn.date,
        categoryId: dto.categoryMap?.[txn.tempId] || defaultCategory.id,
        accountId: mappedAccountId === 'main' ? null : (mappedAccountId || null),
        userId,
        bankStatementId: id,
        source: 'BANK_IMPORT' as const,
      };
    });

    // Batch create
    const result = await this.repository.createTransactions(transactionData);

    this.logger.log(
      `Imported ${result.count} transactions from bank statement ${id}`,
    );

    return {
      imported: result.count,
      bankStatementId: id,
    };
  }
}
