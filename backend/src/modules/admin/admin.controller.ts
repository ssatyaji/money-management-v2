import { Controller, Get } from '@nestjs/common';
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
}
