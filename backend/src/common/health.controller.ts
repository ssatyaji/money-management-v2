import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check — verify server is ready' })
  check() {
    return { status: 'ok', timestamp: Date.now() };
  }
}
