import {
  Controller,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to web push notifications' })
  @HttpCode(HttpStatus.CREATED)
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribeDto,
  ) {
    await this.notificationsService.subscribe(userId, dto);
    return { success: true };
  }

  @Delete('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from web push notifications' })
  @HttpCode(HttpStatus.OK)
  async unsubscribe(
    @CurrentUser('id') userId: string,
    @Body('endpoint') endpoint: string,
  ) {
    return this.notificationsService.unsubscribe(userId, endpoint);
  }
}
