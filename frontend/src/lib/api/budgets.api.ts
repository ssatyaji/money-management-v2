import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';

// ─── Budget Types ────────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  period: string;
  alertAt: number;
  startDate: string;
  endDate: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
  };
  userId: string;
  createdAt: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  activeBudgetCount: number;
  overBudgetCount: number;
  nearLimitCount: number;
  budgets: Budget[];
}

export interface CreateBudgetInput {
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
  categoryId: string;
  alertAt?: number;
}

// ─── Budget API ──────────────────────────────────────────────────────────────

export const budgetsApi = {
  getAll: async (): Promise<Budget[]> => {
    const response = await apiClient.get<ApiResponse<Budget[]>>('/budgets');
    return response.data.data;
  },

  getActive: async (): Promise<Budget[]> => {
    const response = await apiClient.get<ApiResponse<Budget[]>>('/budgets/active');
    return response.data.data;
  },

  getSummary: async (): Promise<BudgetSummary> => {
    const response = await apiClient.get<ApiResponse<BudgetSummary>>('/budgets/summary');
    return response.data.data;
  },

  getById: async (id: string): Promise<Budget> => {
    const response = await apiClient.get<ApiResponse<Budget>>(`/budgets/${id}`);
    return response.data.data;
  },

  create: async (data: CreateBudgetInput): Promise<Budget> => {
    const response = await apiClient.post<ApiResponse<Budget>>('/budgets', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateBudgetInput>): Promise<Budget> => {
    const response = await apiClient.patch<ApiResponse<Budget>>(`/budgets/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/budgets/${id}`);
  },
};

// ─── Reports Types ───────────────────────────────────────────────────────────

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
  total: number;
  count: number;
}

export interface DailyTrendItem {
  date: string;
  income: number;
  expense: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
  dailyTrend: DailyTrendItem[];
}

export interface MonthData {
  month: number;
  name: string;
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface YearlyReport {
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  months: MonthData[];
  categoryBreakdown: CategoryBreakdownItem[];
}

// ─── Reports API ─────────────────────────────────────────────────────────────

export const reportsApi = {
  getMonthly: async (month: number, year: number): Promise<MonthlyReport> => {
    const response = await apiClient.get<ApiResponse<MonthlyReport>>('/reports/monthly', {
      params: { month, year },
    });
    return response.data.data;
  },

  getYearly: async (year: number): Promise<YearlyReport> => {
    const response = await apiClient.get<ApiResponse<YearlyReport>>('/reports/yearly', {
      params: { year },
    });
    return response.data.data;
  },
};
