import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiAdvisorService } from './ai-advisor.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('AI Advisor')
@ApiBearerAuth('access-token')
@Controller('ai-advisor')
export class AiAdvisorController {
  constructor(private readonly svc: AiAdvisorService) {}

  @Get('insights')
  @ApiOperation({ summary: 'Get weekly AI insights' })
  insights(@CurrentUser('id') id: string) {
    return this.svc.getInsights(id);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create chat session' })
  create(@CurrentUser('id') id: string, @Body() dto: CreateSessionDto) {
    return this.svc.createSession(id, dto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session + messages' })
  get(@CurrentUser('id') uid: string, @Param('id') id: string) {
    return this.svc.getSession(uid, id);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send message to AI' })
  msg(@CurrentUser('id') uid: string, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.svc.sendMessage(uid, id, dto.content);
  }

  @Post('insights/generate')
  @ApiOperation({ summary: 'Trigger insight generation' })
  gen(@CurrentUser('id') id: string) {
    return this.svc.generateInsightsForUser(id);
  }
}
