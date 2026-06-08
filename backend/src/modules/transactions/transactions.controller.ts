import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with filters and pagination' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() filters: FilterTransactionDto,
  ) {
    return this.transactionsService.findAll(userId, filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get monthly income/expense summary' })
  getSummary(
    @CurrentUser('id') userId: string,
    @Query('month') month: number = new Date().getMonth() + 1,
    @Query('year') year: number = new Date().getFullYear(),
  ) {
    return this.transactionsService.getSummary(userId, month, year);
  }

  @Get('category-breakdown')
  @ApiOperation({ summary: 'Get expense breakdown by category for a month' })
  getCategoryBreakdown(
    @CurrentUser('id') userId: string,
    @Query('month') month: number = new Date().getMonth() + 1,
    @Query('year') year: number = new Date().getFullYear(),
    @Query('type') type: string = 'EXPENSE',
  ) {
    return this.transactionsService.getCategoryBreakdown(userId, month, year, type);
  }

  @Get('daily-trend')
  @ApiOperation({ summary: 'Get daily income/expense trend for a month' })
  getDailyTrend(
    @CurrentUser('id') userId: string,
    @Query('month') month: number = new Date().getMonth() + 1,
    @Query('year') year: number = new Date().getFullYear(),
  ) {
    return this.transactionsService.getDailyTrend(userId, month, year);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent transactions' })
  getRecent(
    @CurrentUser('id') userId: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.transactionsService.getRecentTransactions(userId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.transactionsService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.transactionsService.remove(userId, id);
  }
}
