import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly financial report' })
  getMonthlyReport(
    @CurrentUser('id') userId: string,
    @Query('month') month: number = new Date().getMonth() + 1,
    @Query('year') year: number = new Date().getFullYear(),
  ) {
    return this.reportsService.getMonthlyReport(userId, month, year);
  }

  @Get('yearly')
  @ApiOperation({ summary: 'Get yearly financial report' })
  getYearlyReport(
    @CurrentUser('id') userId: string,
    @Query('year') year: number = new Date().getFullYear(),
  ) {
    return this.reportsService.getYearlyReport(userId, year);
  }
}
