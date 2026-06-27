import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, InvestmentAsset, InvestmentTransaction } from '@prisma/client';

@Injectable()
export class InvestmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAsset(data: Prisma.InvestmentAssetUncheckedCreateInput): Promise<InvestmentAsset> {
    return this.prisma.investmentAsset.create({ data });
  }

  async findAllAssets(params: {
    where?: Prisma.InvestmentAssetWhereInput;
    orderBy?: Prisma.InvestmentAssetOrderByWithRelationInput;
  }): Promise<InvestmentAsset[]> {
    return this.prisma.investmentAsset.findMany({
      where: params.where,
      orderBy: params.orderBy || { createdAt: 'desc' },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findAssetById(id: string) {
    return this.prisma.investmentAsset.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  async updateAsset(
    id: string,
    data: Prisma.InvestmentAssetUncheckedUpdateInput,
  ): Promise<InvestmentAsset> {
    return this.prisma.investmentAsset.update({
      where: { id },
      data,
    });
  }

  async deleteAsset(id: string): Promise<InvestmentAsset> {
    return this.prisma.investmentAsset.delete({ where: { id } });
  }

  async createTransaction(data: Prisma.InvestmentTransactionUncheckedCreateInput): Promise<InvestmentTransaction> {
    return this.prisma.investmentTransaction.create({ data });
  }

  async getPortfolioSummary(userId: string) {
    const assets = await this.prisma.investmentAsset.findMany({
      where: { userId },
    });

    const totalInvested = assets.reduce((sum, a) => sum + Number(a.totalInvested), 0);
    const totalCurrentValue = assets.reduce((sum, a) => sum + Number(a.currentValue), 0);
    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
      : 0;

    // Allocation by asset type
    const allocationByType: Record<string, number> = {};
    for (const asset of assets) {
      const type = asset.assetType;
      allocationByType[type] = (allocationByType[type] || 0) + Number(asset.currentValue);
    }

    const allocation = Object.entries(allocationByType).map(([type, value]) => ({
      type,
      value,
      percentage: totalCurrentValue > 0 ? Math.round((value / totalCurrentValue) * 100) : 0,
    }));

    return {
      totalAssets: assets.length,
      totalInvested,
      totalCurrentValue,
      totalGainLoss,
      totalGainLossPercent: Math.round(totalGainLossPercent * 100) / 100,
      allocation,
    };
  }
}
