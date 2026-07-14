import { Controller, Get, Post, Delete, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleEnum } from '../../common/constants/roles.enum';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@Roles(RoleEnum.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get global system statistics (Admin only)' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get global activity logs (Admin only)' })
  getActivityLogs(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getActivityLogs({ page, limit, search, userId, action });
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get platform operational expenses (Admin only)' })
  getPlatformExpenses(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.adminService.getPlatformExpenses({ page, limit, search, category });
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Create platform operational expense (Admin only)' })
  createPlatformExpense(
    @Body() data: { description: string; amount: number; category: string; notes?: string; date?: Date },
  ) {
    return this.adminService.createPlatformExpense(data);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete platform operational expense (Admin only)' })
  deletePlatformExpense(@Param('id') id: string) {
    return this.adminService.deletePlatformExpense(id);
  }
}
