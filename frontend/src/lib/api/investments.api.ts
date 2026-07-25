import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';

// ─── Investment Types ───────────────────────────────────────────────────────

export interface InvestmentTransaction {
  id: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND';
  units: number;
  pricePerUnit: number;
  totalAmount: number;
  fee: number;
  note: string | null;
  date: string;
  createdAt: string;
}

export type AssetType = 'STOCK' | 'GOLD' | 'CRYPTO' | 'MUTUAL_FUND' | 'BOND' | 'DEPOSIT' | 'PROPERTY' | 'OTHER';

export interface InvestmentAsset {
  id: string;
  name: string;
  ticker: string | null;
  assetType: AssetType;
  icon: string | null;
  color: string | null;
  totalUnits: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentPriceDate: string;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  userId: string;
  transactions?: InvestmentTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface AllocationItem {
  type: string;
  value: number;
  percentage: number;
}

export interface PortfolioSummary {
  totalAssets: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  allocation: AllocationItem[];
}

export interface CreateAssetInput {
  name: string;
  assetType: AssetType;
  totalUnits: number;
  avgBuyPrice: number;
  currentPrice: number;
  ticker?: string;
  icon?: string;
  color?: string;
}

export interface CreateInvestmentTxInput {
  type: 'BUY' | 'SELL' | 'DIVIDEND';
  units: number;
  pricePerUnit: number;
  fee?: number;
  note?: string;
  date?: string;
}

// ─── Investments API ────────────────────────────────────────────────────────

export const investmentsApi = {
  getAllAssets: async (): Promise<InvestmentAsset[]> => {
    const response = await apiClient.get<ApiResponse<InvestmentAsset[]>>('/investments/assets');
    return response.data.data;
  },

  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    const response = await apiClient.get<ApiResponse<PortfolioSummary>>('/investments/portfolio');
    return response.data.data;
  },

  getAssetById: async (id: string): Promise<InvestmentAsset> => {
    const response = await apiClient.get<ApiResponse<InvestmentAsset>>(`/investments/assets/${id}`);
    return response.data.data;
  },

  createAsset: async (data: CreateAssetInput): Promise<InvestmentAsset> => {
    const response = await apiClient.post<ApiResponse<InvestmentAsset>>('/investments/assets', data);
    return response.data.data;
  },

  updateAsset: async (id: string, data: Partial<CreateAssetInput>): Promise<InvestmentAsset> => {
    const response = await apiClient.patch<ApiResponse<InvestmentAsset>>(`/investments/assets/${id}`, data);
    return response.data.data;
  },

  deleteAsset: async (id: string): Promise<void> => {
    await apiClient.delete(`/investments/assets/${id}`);
  },

  addTransaction: async (assetId: string, data: CreateInvestmentTxInput): Promise<InvestmentAsset> => {
    const response = await apiClient.post<ApiResponse<InvestmentAsset>>(`/investments/assets/${assetId}/transactions`, data);
    return response.data.data;
  },

  updateTransaction: async (
    assetId: string,
    txId: string,
    data: Partial<CreateInvestmentTxInput>,
  ): Promise<InvestmentAsset> => {
    const response = await apiClient.patch<ApiResponse<InvestmentAsset>>(
      `/investments/assets/${assetId}/transactions/${txId}`,
      data,
    );
    return response.data.data;
  },

  deleteTransaction: async (assetId: string, txId: string): Promise<InvestmentAsset> => {
    const response = await apiClient.delete<ApiResponse<InvestmentAsset>>(
      `/investments/assets/${assetId}/transactions/${txId}`,
    );
    return response.data.data;
  },

  getLivePrice: async (ticker: string, assetType: AssetType): Promise<{ price: number | null }> => {
    const response = await apiClient.get<ApiResponse<{ price: number | null }>>('/investments/price', {
      params: { ticker, assetType },
    });
    return response.data.data;
  },
};
