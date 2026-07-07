import apiClient from './client';
import { ApiResponse } from '@/types/api.types';

export interface MonthPredictorData {
  currentBalance: number;
  projectedIncome: number;
  projectedExpense: number;
  estimatedEndBalance: number;
  safeToSpend: number;
  daysRemaining: number;
  status: 'SAFE' | 'CAUTION' | 'DANGER';
  breakdown: {
    recurringIncome: number;
    recurringExpense: number;
    avgDailyExpense: number;
    projectedDailyExpense: number;
  };
}

export const reportsApi = {
  getMonthPredictor: async (): Promise<MonthPredictorData> => {
    const res = await apiClient.get<ApiResponse<MonthPredictorData>>('/reports/month-predictor');
    return res.data.data;
  },
};
