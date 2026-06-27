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
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Debts')
@ApiBearerAuth('access-token')
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new debt record' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateDebtDto) {
    return this.debtsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all debts with optional filters' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.debtsService.findAll(userId, type, status);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get debt summary' })
  getSummary(@CurrentUser('id') userId: string) {
    return this.debtsService.getSummary(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get debt by ID' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.debtsService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a debt record' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDebtDto,
  ) {
    return this.debtsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a debt record' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.debtsService.remove(userId, id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Add payment to a debt' })
  addPayment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddPaymentDto,
  ) {
    return this.debtsService.addPayment(userId, id, dto);
  }
}
