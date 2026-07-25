import apiClient from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Transaction, Category, CreateTransactionInput } from '@/types/transaction.types';

// ─── Categories API ──────────────────────────────────────────────────────────

export const categoriesApi = {
  getAll: async (type?: string): Promise<Category[]> => {
    const params = type ? { type } : {};
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories', { params });
    return response.data.data;
  },

  create: async (data: { name: string; icon?: string; color?: string; type: string }): Promise<Category> => {
    const response = await apiClient.post<ApiResponse<Category>>('/categories', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<{ name: string; icon: string; color: string }>): Promise<Category> => {
    const response = await apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};

// ─── Transactions API ────────────────────────────────────────────────────────

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  categoryId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  allTimeBalance?: number;
  month: number;
  year: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  category: Category;
  total: number;
  count: number;
}

export interface DailyTrendItem {
  date: string;
  income: number;
  expense: number;
}

export interface ForecastItem {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export const transactionsApi = {
  getAll: async (filters: TransactionFilters): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<PaginatedResponse<Transaction>>('/transactions', {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return response.data.data;
  },

  create: async (data: CreateTransactionInput): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<Transaction>>('/transactions', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateTransactionInput>): Promise<Transaction> => {
    const response = await apiClient.patch<ApiResponse<Transaction>>(`/transactions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  getSummary: async (month: number, year: number): Promise<TransactionSummary> => {
    const response = await apiClient.get<ApiResponse<TransactionSummary>>('/transactions/summary', {
      params: { month, year },
    });
    return response.data.data;
  },

  getCategoryBreakdown: async (
    month: number,
    year: number,
    type: string = 'EXPENSE',
  ): Promise<CategoryBreakdownItem[]> => {
    const response = await apiClient.get<ApiResponse<CategoryBreakdownItem[]>>(
      '/transactions/category-breakdown',
      { params: { month, year, type } },
    );
    return response.data.data;
  },

  getDailyTrend: async (month: number, year: number): Promise<DailyTrendItem[]> => {
    const response = await apiClient.get<ApiResponse<DailyTrendItem[]>>('/transactions/daily-trend', {
      params: { month, year },
    });
    return response.data.data;
  },

  getRecent: async (limit: number = 5): Promise<Transaction[]> => {
    const response = await apiClient.get<ApiResponse<Transaction[]>>('/transactions/recent', {
      params: { limit },
    });
    return response.data.data;
  },

  export: async (
    format: 'excel' | 'pdf',
    period: 'monthly' | 'yearly',
    month: number,
    year: number,
  ): Promise<Blob> => {
    const response = await apiClient.get('/transactions/export', {
      params: { format, period, month, year },
      responseType: 'blob',
    });
    return response.data;
  },

  getCashflowForecast: async (): Promise<ForecastItem[]> => {
    const response = await apiClient.get<ApiResponse<ForecastItem[]>>('/reports/forecast');
    return response.data.data;
  },
};
