import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InvestmentsRepository } from './investments.repository';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateInvestmentTxDto } from './dto/create-investment-tx.dto';
import { InvestmentAsset } from '@prisma/client';
import { MarketDataService } from './market-data.service';

export interface EnrichedAsset extends Omit<InvestmentAsset, 'totalUnits' | 'avgBuyPrice' | 'currentPrice' | 'totalInvested' | 'currentValue'> {
  totalUnits: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  transactions?: Array<{
    id: string;
    type: string;
    units: number;
    pricePerUnit: number;
    totalAmount: number;
    fee: number;
    note: string | null;
    date: Date;
    createdAt: Date;
  }>;
}

@Injectable()
export class InvestmentsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(
    private readonly investmentsRepository: InvestmentsRepository,
    private readonly marketDataService: MarketDataService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Application started. Running initial sync of investment market prices...');
    // Run sync in the background so it doesn't block server startup
    this.syncMarketPrices().catch((err) => {
      this.logger.warn(`Failed to run initial market price sync on bootstrap: ${err.message}`);
    });
  }

  async createAsset(userId: string, dto: CreateAssetDto): Promise<EnrichedAsset> {
    let currentPrice = dto.currentPrice;
    if (dto.ticker) {
      const fetchedPrice = await this.marketDataService.getPrice(dto.ticker, dto.assetType);
      if (fetchedPrice !== null) {
        currentPrice = fetchedPrice;
      }
    }
    const multiplier = dto.assetType === 'STOCK' ? 100 : 1;
    const totalInvested = dto.totalUnits * dto.avgBuyPrice * multiplier;
    const currentValue = dto.totalUnits * currentPrice * multiplier;

    const asset = await this.investmentsRepository.createAsset({
      name: dto.name,
      assetType: dto.assetType,
      totalUnits: dto.totalUnits,
      avgBuyPrice: dto.avgBuyPrice,
      currentPrice: currentPrice,
      totalInvested,
      currentValue,
      ticker: dto.ticker,
      icon: dto.icon,
      color: dto.color,
      userId,
    });

    return this.enrichAsset(asset);
  }

  async findAllAssets(userId: string): Promise<EnrichedAsset[]> {
    const assets = await this.investmentsRepository.findAllAssets({
      where: { userId },
    });
    return assets.map((asset) => this.enrichAsset(asset));
  }

  async findAssetById(userId: string, id: string): Promise<EnrichedAsset> {
    const asset = await this.investmentsRepository.findAssetById(id);
    if (!asset) {
      throw new NotFoundException('Investment asset not found');
    }
    if (asset.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.enrichAsset(asset);
  }

  async updateAsset(
    userId: string,
    id: string,
    dto: UpdateAssetDto,
  ): Promise<EnrichedAsset> {
    const existingAsset = await this.findAssetById(userId, id);
    const multiplier = existingAsset.assetType === 'STOCK' ? 100 : 1;

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.assetType !== undefined) updateData.assetType = dto.assetType;
    if (dto.ticker !== undefined) updateData.ticker = dto.ticker;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.color !== undefined) updateData.color = dto.color;

    // If currentPrice is updated, recalculate currentValue
    if (dto.currentPrice !== undefined) {
      updateData.currentPrice = dto.currentPrice;
      updateData.currentPriceDate = new Date();
      const units = dto.totalUnits !== undefined ? dto.totalUnits : existingAsset.totalUnits;
      updateData.currentValue = units * dto.currentPrice * multiplier;
    }

    if (dto.totalUnits !== undefined) {
      updateData.totalUnits = dto.totalUnits;
      const price = dto.currentPrice !== undefined ? dto.currentPrice : existingAsset.currentPrice;
      updateData.currentValue = dto.totalUnits * price * multiplier;
    }

    if (dto.avgBuyPrice !== undefined) {
      updateData.avgBuyPrice = dto.avgBuyPrice;
      const units = dto.totalUnits !== undefined ? dto.totalUnits : existingAsset.totalUnits;
      updateData.totalInvested = units * dto.avgBuyPrice * multiplier;
    }

    const asset = await this.investmentsRepository.updateAsset(id, updateData);
    return this.enrichAsset(asset);
  }

  async removeAsset(userId: string, id: string) {
    await this.findAssetById(userId, id);
    return this.investmentsRepository.deleteAsset(id);
  }

  async addTransaction(
    userId: string,
    assetId: string,
    dto: CreateInvestmentTxDto,
  ): Promise<EnrichedAsset> {
    const rawAsset = await this.investmentsRepository.findAssetById(assetId);
    if (!rawAsset) {
      throw new NotFoundException('Investment asset not found');
    }
    if (rawAsset.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const totalUnitsCount = Number(rawAsset.totalUnits);
    if (dto.type === 'SELL' && dto.units > totalUnitsCount) {
      throw new BadRequestException('Cannot sell more units than owned');
    }

    const multiplier = rawAsset.assetType === 'STOCK' ? 100 : 1;
    const totalAmount = dto.units * dto.pricePerUnit * multiplier;

    await this.investmentsRepository.createTransaction({
      type: dto.type,
      units: dto.units,
      pricePerUnit: dto.pricePerUnit,
      totalAmount,
      fee: dto.fee || 0,
      note: dto.note,
      date: dto.date ? new Date(dto.date) : new Date(),
      assetId,
    });

    // Update asset based on transaction type
    const updateData: Record<string, unknown> = {};

    if (dto.type === 'BUY') {
      const newTotalUnits = totalUnitsCount + dto.units;
      // Weighted average buy price
      const newTotalInvested = Number(rawAsset.totalInvested) + totalAmount;
      const newAvgBuyPrice = newTotalUnits > 0 ? newTotalInvested / (newTotalUnits * multiplier) : 0;

      updateData.totalUnits = newTotalUnits;
      updateData.avgBuyPrice = Math.round(newAvgBuyPrice * 100) / 100;
      updateData.totalInvested = newTotalInvested;
      updateData.currentValue = newTotalUnits * Number(rawAsset.currentPrice) * multiplier;
    } else if (dto.type === 'SELL') {
      const newTotalUnits = totalUnitsCount - dto.units;
      // Reduce totalInvested proportionally
      const soldRatio = totalUnitsCount > 0 ? dto.units / totalUnitsCount : 0;
      const newTotalInvested = Number(rawAsset.totalInvested) * (1 - soldRatio);

      updateData.totalUnits = newTotalUnits;
      updateData.totalInvested = Math.round(newTotalInvested * 100) / 100;
      updateData.currentValue = newTotalUnits * Number(rawAsset.currentPrice) * multiplier;
      // avgBuyPrice stays the same
    }
    // DIVIDEND: no change to units or invested amount

    if (Object.keys(updateData).length > 0) {
      await this.investmentsRepository.updateAsset(assetId, updateData);
    }

    const updatedAsset = await this.investmentsRepository.findAssetById(assetId);
    if (!updatedAsset) {
      throw new NotFoundException('Investment asset not found');
    }
    return this.enrichAsset(updatedAsset);
  }

  @Cron('*/5 * * * *')
  async syncMarketPrices() {
    const assets = await this.investmentsRepository.findAllAssets({});
    for (const asset of assets) {
      if (asset.ticker) {
        const price = await this.marketDataService.getPrice(asset.ticker, asset.assetType);
        if (price !== null && price !== Number(asset.currentPrice)) {
          const totalUnits = Number(asset.totalUnits);
          const multiplier = asset.assetType === 'STOCK' ? 100 : 1;
          await this.investmentsRepository.updateAsset(asset.id, {
            currentPrice: price,
            currentPriceDate: new Date(),
            currentValue: totalUnits * price * multiplier,
          });
        }
      }
    }
  }

  async getPortfolioSummary(userId: string) {
    return this.investmentsRepository.getPortfolioSummary(userId);
  }

  private enrichAsset(asset: InvestmentAsset & { transactions?: Array<{ id: string; type: string; units: any; pricePerUnit: any; totalAmount: any; fee: any; note: string | null; date: Date; createdAt: Date }> }): EnrichedAsset {
    const totalUnits = Number(asset.totalUnits);
    const avgBuyPrice = Number(asset.avgBuyPrice);
    const currentPrice = Number(asset.currentPrice);
    const totalInvested = Number(asset.totalInvested);
    const currentValue = Number(asset.currentValue);

    const gainLoss = currentValue - totalInvested;
    const gainLossPercent = totalInvested > 0
      ? Math.round(((currentValue - totalInvested) / totalInvested) * 10000) / 100
      : 0;

    return {
      ...asset,
      totalUnits,
      avgBuyPrice,
      currentPrice,
      totalInvested,
      currentValue,
      gainLoss,
      gainLossPercent,
      transactions: asset.transactions?.map((t) => ({
        ...t,
        units: Number(t.units),
        pricePerUnit: Number(t.pricePerUnit),
        totalAmount: Number(t.totalAmount),
        fee: Number(t.fee),
      })),
    };
  }
}
