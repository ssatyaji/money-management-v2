import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Budgets')
@ApiBearerAuth('access-token')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  findAll(@CurrentUser('id') userId: string) {
    return this.budgetsService.findAll(userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active budgets for current period' })
  findActive(@CurrentUser('id') userId: string) {
    return this.budgetsService.findActiveBudgets(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get budget summary with totals' })
  getSummary(@CurrentUser('id') userId: string) {
    return this.budgetsService.getSummary(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.budgetsService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.budgetsService.remove(userId, id);
  }
}
