import { Controller, Get, Patch, Post, Param, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Alerts')
@ApiBearerAuth('access-token')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get active alerts' })
  get(@CurrentUser('id') userId: string) {
    return this.alertsService.getActiveAlerts(userId);
  }

  @Patch(':id/read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark alert as read' })
  read(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.alertsService.markAsRead(userId, id);
  }

  @Patch('read-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark all alerts as read' })
  readAll(@CurrentUser('id') userId: string) {
    return this.alertsService.markAllAsRead(userId);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Trigger evaluation of alerts' })
  refresh(@CurrentUser('id') userId: string) {
    return this.alertsService.evaluateAlerts(userId);
  }
}
