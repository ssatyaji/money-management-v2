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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reminders')
@ApiBearerAuth('access-token')
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reminder' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReminderDto) {
    return this.remindersService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reminders (filterable by status)' })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['upcoming', 'overdue', 'completed'],
  })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('filter') filter?: 'upcoming' | 'overdue' | 'completed',
  ) {
    return this.remindersService.findAll(userId, filter);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get reminders due in the next 7 days' })
  getUpcoming(@CurrentUser('id') userId: string) {
    return this.remindersService.getUpcoming(userId);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue reminders' })
  getOverdue(@CurrentUser('id') userId: string) {
    return this.remindersService.getOverdue(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reminder by ID' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.remindersService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reminder' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.remindersService.update(userId, id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Mark a reminder as complete (auto-creates next if recurring)',
  })
  markComplete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.remindersService.markComplete(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reminder' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.remindersService.remove(userId, id);
  }
}
