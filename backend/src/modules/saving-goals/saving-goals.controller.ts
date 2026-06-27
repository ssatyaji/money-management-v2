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
import { SavingGoalsService } from './saving-goals.service';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto';
import { AddContributionDto } from './dto/add-contribution.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Saving Goals')
@ApiBearerAuth('access-token')
@Controller('saving-goals')
export class SavingGoalsController {
  constructor(private readonly savingGoalsService: SavingGoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new saving goal' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSavingGoalDto) {
    return this.savingGoalsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saving goals' })
  findAll(@CurrentUser('id') userId: string) {
    return this.savingGoalsService.findAll(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get saving goals summary' })
  getSummary(@CurrentUser('id') userId: string) {
    return this.savingGoalsService.getSummary(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get saving goal by ID' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savingGoalsService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saving goal' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSavingGoalDto,
  ) {
    return this.savingGoalsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saving goal' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savingGoalsService.remove(userId, id);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Add contribution to a saving goal' })
  addContribution(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddContributionDto,
  ) {
    return this.savingGoalsService.addContribution(userId, id, dto);
  }
}
