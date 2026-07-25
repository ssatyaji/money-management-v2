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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvestmentsService } from './investments.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateInvestmentTxDto } from './dto/create-investment-tx.dto';
import { UpdateInvestmentTxDto } from './dto/update-investment-tx.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Investments')
@ApiBearerAuth('access-token')
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('price')
  @ApiOperation({ summary: 'Fetch live asset price' })
  getPrice(
    @Query('ticker') ticker: string,
    @Query('assetType') assetType: string,
  ) {
    return this.investmentsService.getLivePrice(ticker, assetType);
  }

  @Post('assets')
  @ApiOperation({ summary: 'Add a new investment asset' })
  createAsset(@CurrentUser('id') userId: string, @Body() dto: CreateAssetDto) {
    return this.investmentsService.createAsset(userId, dto);
  }

  @Get('assets')
  @ApiOperation({ summary: 'Get all investment assets with gain/loss' })
  findAllAssets(@CurrentUser('id') userId: string) {
    return this.investmentsService.findAllAssets(userId);
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Get portfolio summary' })
  getPortfolioSummary(@CurrentUser('id') userId: string) {
    return this.investmentsService.getPortfolioSummary(userId);
  }

  @Get('assets/:id')
  @ApiOperation({ summary: 'Get asset detail with transaction history' })
  findAssetById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.investmentsService.findAssetById(userId, id);
  }

  @Patch('assets/:id')
  @ApiOperation({ summary: 'Update asset info or current price' })
  updateAsset(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.investmentsService.updateAsset(userId, id, dto);
  }

  @Delete('assets/:id')
  @ApiOperation({ summary: 'Delete an investment asset' })
  removeAsset(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.investmentsService.removeAsset(userId, id);
  }

  @Post('assets/:id/transactions')
  @ApiOperation({ summary: 'Record buy/sell/dividend transaction' })
  addTransaction(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateInvestmentTxDto,
  ) {
    return this.investmentsService.addTransaction(userId, id, dto);
  }

  @Patch('assets/:id/transactions/:txId')
  @ApiOperation({ summary: 'Update an investment transaction' })
  updateTransaction(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('txId') txId: string,
    @Body() dto: UpdateInvestmentTxDto,
  ) {
    return this.investmentsService.updateTransaction(userId, id, txId, dto);
  }

  @Delete('assets/:id/transactions/:txId')
  @ApiOperation({ summary: 'Delete an investment transaction' })
  removeTransaction(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('txId') txId: string,
  ) {
    return this.investmentsService.removeTransaction(userId, id, txId);
  }
}
