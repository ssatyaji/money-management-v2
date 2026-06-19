import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Post as TriggerPost,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Recurring Transactions')
@ApiBearerAuth('access-token')
@Controller('recurring-transactions')
export class RecurringTransactionsController {
  constructor(private readonly service: RecurringTransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recurring transaction template' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRecurringTransactionDto,
  ) {
    return this.service.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active/inactive recurring transactions for user' })
  findAll(@CurrentUser('id') userId: string) {
    return this.service.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recurring transaction by ID' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring transaction' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringTransactionDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recurring transaction' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }

  @TriggerPost('trigger-cron')
  @ApiOperation({ summary: 'Manual trigger for testing cron job (Admin/Developer test)' })
  manualTrigger() {
    return this.service.processRecurringTransactions();
  }
}
