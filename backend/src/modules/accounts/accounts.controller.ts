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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Accounts')
@ApiBearerAuth('access-token')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet account' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wallet accounts' })
  findAll(@CurrentUser('id') userId: string) {
    return this.accountsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wallet account by ID' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.accountsService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a wallet account' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a wallet account' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.accountsService.remove(userId, id);
  }
}
