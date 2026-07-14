import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { ActivityLogService } from '../admin/activity-log.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.type === 'TRANSFER') {
      if (!dto.accountId || !dto.destinationAccountId) {
        throw new BadRequestException('Transfer requires both source and destination accounts');
      }
      const sourceId = dto.accountId === 'main' ? 'main' : dto.accountId;
      const destId = dto.destinationAccountId === 'main' ? 'main' : dto.destinationAccountId;
      if (sourceId === destId) {
        throw new BadRequestException('Source and destination accounts must be different');
      }

      // Check balance
      const sourceBalance = await this.accountsService.findById(userId, sourceId);
      if (dto.amount > sourceBalance.balance) {
        throw new BadRequestException(`Insufficient funds in source wallet. Available balance: Rp ${sourceBalance.balance.toLocaleString('id-ID')}`);
      }
    }

    let categoryId = dto.categoryId;
    if (dto.type === 'TRANSFER') {
      let transferCat = await this.prisma.category.findFirst({
        where: {
          type: 'TRANSFER',
          OR: [{ userId: null }, { userId }],
        },
      });
      if (!transferCat) {
        transferCat = await this.prisma.category.create({
          data: {
            name: 'Transfer',
            icon: '🔄',
            color: '#6366f1',
            type: 'TRANSFER',
            isDefault: true,
          },
        });
      }
      categoryId = transferCat.id;
    }

    const transaction = await this.transactionsRepository.create({
      amount: dto.amount,
      type: dto.type,
      description: dto.description,
      note: dto.note,
      date: new Date(dto.date),
      categoryId,
      accountId: dto.accountId === 'main' ? null : (dto.accountId || null),
      destinationAccountId: dto.type === 'TRANSFER'
        ? (dto.destinationAccountId === 'main' ? null : dto.destinationAccountId)
        : null,
      userId,
      source: 'MANUAL',
    });

    await this.activityLogService.log(
      userId,
      'CREATE_TRANSACTION',
      `Membuat transaksi: ${transaction.type} - Rp ${Number(transaction.amount).toLocaleString('id-ID')} (${transaction.description || 'Tanpa deskripsi'})`
    );

    return transaction;
  }

  async findAll(
    userId: string,
    filters: FilterTransactionDto,
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.TransactionWhereInput = { userId };
    const andClauses: Prisma.TransactionWhereInput[] = [];

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.accountId) {
      const accId = filters.accountId === 'main' ? null : filters.accountId;
      andClauses.push({
        OR: [
          { accountId: accId },
          { destinationAccountId: accId },
        ],
      });
    }

    if (filters.startDate || filters.endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.startDate) {
        dateFilter.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        dateFilter.lte = new Date(filters.endDate + 'T23:59:59.999Z');
      }
      where.date = dateFilter;
    }

    if (filters.search) {
      andClauses.push({
        OR: [
          { description: { contains: filters.search, mode: 'insensitive' } },
          { note: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const { data, total } = await this.transactionsRepository.findAll({
      skip: filters.skip,
      take: filters.limit,
      where,
    });

    return {
      success: true,
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findById(userId: string, id: string) {
    const transaction = await this.transactionsRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.findById(userId, id); // validates ownership

    const finalType = dto.type !== undefined ? dto.type : existing.type;
    const finalAccountId = dto.accountId !== undefined
      ? (dto.accountId === 'main' ? null : dto.accountId)
      : existing.accountId;
    const finalDestAccountId = dto.destinationAccountId !== undefined
      ? (dto.destinationAccountId === 'main' ? null : dto.destinationAccountId)
      : existing.destinationAccountId;

    if (finalType === 'TRANSFER') {
      const sourceId = finalAccountId === null ? 'main' : finalAccountId;
      const destId = finalDestAccountId === null ? 'main' : finalDestAccountId;
      if (sourceId === destId) {
        throw new BadRequestException('Source and destination accounts must be different');
      }

      // Check balance
      const checkAmount = dto.amount !== undefined ? dto.amount : Number(existing.amount);
      const sourceBalance = await this.accountsService.findById(userId, sourceId);
      
      let available = sourceBalance.balance;
      if (existing.type === 'TRANSFER' && existing.accountId === finalAccountId) {
        available += Number(existing.amount);
      }
      
      if (checkAmount > available) {
        throw new BadRequestException(`Insufficient funds in source wallet. Available balance: Rp ${available.toLocaleString('id-ID')}`);
      }
    }

    const updateData: Prisma.TransactionUncheckedUpdateInput = {};
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.note !== undefined) updateData.note = dto.note;
    if (dto.date !== undefined) updateData.date = new Date(dto.date);

    if (finalType === 'TRANSFER') {
      let transferCat = await this.prisma.category.findFirst({
        where: {
          type: 'TRANSFER',
          OR: [{ userId: null }, { userId }],
        },
      });
      if (!transferCat) {
        transferCat = await this.prisma.category.create({
          data: {
            name: 'Transfer',
            icon: '🔄',
            color: '#6366f1',
            type: 'TRANSFER',
            isDefault: true,
          },
        });
      }
      updateData.categoryId = transferCat.id;
    } else {
      if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    }

    if (dto.accountId !== undefined) {
      updateData.accountId = dto.accountId === 'main' ? null : dto.accountId;
    }

    if (dto.destinationAccountId !== undefined) {
      updateData.destinationAccountId = dto.destinationAccountId === 'main' ? null : dto.destinationAccountId;
    } else if (dto.type !== undefined && dto.type !== 'TRANSFER') {
      updateData.destinationAccountId = null;
    }

    return this.transactionsRepository.update(id, updateData);
  }

  async remove(userId: string, id: string) {
    const transaction = await this.findById(userId, id);
    const result = await this.transactionsRepository.delete(id);
    await this.activityLogService.log(
      userId,
      'DELETE_TRANSACTION',
      `Menghapus transaksi: ${transaction.type} - Rp ${Number(transaction.amount).toLocaleString('id-ID')} (${transaction.description || 'Tanpa deskripsi'})`
    );
    return result;
  }

  async getSummary(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const summary = await this.transactionsRepository.getSummaryByDateRange(
      userId,
      startDate,
      endDate,
    );

    let totalIncome = 0;
    let totalExpense = 0;

    summary.forEach((s) => {
      if (s.type === 'INCOME') totalIncome = Number(s._sum.amount) || 0;
      if (s.type === 'EXPENSE') totalExpense = Number(s._sum.amount) || 0;
    });

    const allTimeBalance = await this.transactionsRepository.getAllTimeBalance(userId);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      allTimeBalance,
      month,
      year,
    };
  }

  async getCategoryBreakdown(
    userId: string,
    month: number,
    year: number,
    type: string,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.transactionsRepository.getCategoryBreakdown(
      userId,
      startDate,
      endDate,
      type,
    );
  }

  async getDailyTrend(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.transactionsRepository.getDailyTrend(
      userId,
      startDate,
      endDate,
    );
  }

  async getRecentTransactions(userId: string, limit: number = 5) {
    return this.transactionsRepository.getRecentTransactions(userId, limit);
  }

  async exportTransactions(
    userId: string,
    format: string, // 'excel' | 'pdf'
    period: string, // 'monthly' | 'yearly'
    month: number,
    year: number,
  ) {
    let startDate: Date;
    let endDate: Date;

    if (period === 'yearly') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    } else {
      // monthly
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    }

    const where: Prisma.TransactionWhereInput = {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    const { data: transactions } = await this.transactionsRepository.findAll({
      skip: 0,
      take: 10000,
      where,
    });

    if (format === 'excel') {
      return this.generateExcel(transactions, period, month, year);
    } else if (format === 'pdf') {
      return this.generatePdf(transactions, period, month, year);
    } else {
      throw new Error('Unsupported format');
    }
  }

  private async generateExcel(transactions: any[], period: string, month: number, year: number) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    const titleStr = `Laporan Transaksi ${period === 'monthly' ? `Bulan ${month} ` : ''}Tahun ${year}`;
    worksheet.addRow([titleStr]);
    worksheet.addRow([]);

    worksheet.columns = [
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Tipe', key: 'type', width: 15 },
      { header: 'Nominal', key: 'amount', width: 20 },
      { header: 'Dompet/Akun', key: 'account', width: 20 },
      { header: 'Deskripsi', key: 'description', width: 30 },
      { header: 'Catatan', key: 'note', width: 30 },
    ];

    worksheet.getRow(3).font = { bold: true };

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'INCOME') totalIncome += Number(tx.amount);
      if (tx.type === 'EXPENSE') totalExpense += Number(tx.amount);

      worksheet.addRow({
        date: tx.date.toLocaleDateString('id-ID'),
        category: tx.category?.name || '-',
        type: tx.type === 'INCOME' ? 'Pemasukan' : (tx.type === 'EXPENSE' ? 'Pengeluaran' : 'Transfer'),
        amount: Number(tx.amount),
        account: tx.type === 'TRANSFER'
          ? `${tx.account?.name || 'Saldo Utama'} ➔ ${tx.destinationAccount?.name || 'Saldo Utama'}`
          : (tx.account?.name || 'Saldo Utama'),
        description: tx.description || '-',
        note: tx.note || '-',
      });
    });

    worksheet.addRow([]);
    worksheet.addRow(['Total Pemasukan:', totalIncome]);
    worksheet.addRow(['Total Pengeluaran:', totalExpense]);
    worksheet.addRow(['Saldo Periode:', totalIncome - totalExpense]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generatePdf(transactions: any[], period: string, month: number, year: number) {
    const PDFDocument = require('pdfkit');
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const titleStr = `Laporan Transaksi ${period === 'monthly' ? `Bulan ${month} ` : ''}Tahun ${year}`;
      doc.fontSize(16).text(titleStr, { align: 'center' });
      doc.moveDown();

      let totalIncome = 0;
      let totalExpense = 0;

      const startX = 30;
      let startY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Tanggal', startX, startY);
      doc.text('Kategori', startX + 70, startY);
      doc.text('Tipe', startX + 160, startY);
      doc.text('Nominal', startX + 220, startY);
      doc.text('Dompet', startX + 300, startY);
      doc.text('Deskripsi', startX + 380, startY);
      
      doc.moveTo(startX, startY + 15).lineTo(565, startY + 15).stroke();
      
      startY += 25;
      doc.font('Helvetica');

      transactions.forEach(tx => {
        if (startY > 750) {
          doc.addPage();
          startY = 50;
        }

        if (tx.type === 'INCOME') totalIncome += Number(tx.amount);
        if (tx.type === 'EXPENSE') totalExpense += Number(tx.amount);

        const dateStr = tx.date.toLocaleDateString('id-ID');
        const catStr = (tx.category?.name || '-').substring(0, 15);
        const typeStr = tx.type === 'INCOME' ? 'In' : (tx.type === 'EXPENSE' ? 'Out' : 'Trf');
        const amountStr = Number(tx.amount).toLocaleString('id-ID');
        const accStr = tx.type === 'TRANSFER'
          ? `${(tx.account?.name || 'Utama').substring(0, 8)}->${(tx.destinationAccount?.name || 'Utama').substring(0, 8)}`
          : (tx.account?.name || 'Utama').substring(0, 12);
        const descStr = (tx.description || '-').substring(0, 30);

        doc.text(dateStr, startX, startY);
        doc.text(catStr, startX + 70, startY);
        doc.text(typeStr, startX + 160, startY);
        doc.text(amountStr, startX + 220, startY);
        doc.text(accStr, startX + 300, startY);
        doc.text(descStr, startX + 380, startY);

        startY += 20;
      });

      doc.moveDown();
      doc.font('Helvetica-Bold');
      doc.text(`Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`, startX, doc.y);
      doc.text(`Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`, startX, doc.y);
      doc.text(`Saldo Periode: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`, startX, doc.y);

      doc.end();
    });
  }
}
