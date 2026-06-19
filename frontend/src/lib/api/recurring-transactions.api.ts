import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Category } from '@/types/transaction.types';

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  note?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
  lastTriggered?: string;
  categoryId: string;
  category: Category;
  accountId: string;
  account: { id: string; name: string; color?: string };
}

export interface CreateRecurringTransactionInput {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  note?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  categoryId: string;
  accountId: string;
  isActive?: boolean;
}

export const recurringTransactionsApi = {
  getAll: async (): Promise<RecurringTransaction[]> => {
    const response = await apiClient.get<ApiResponse<RecurringTransaction[]>>('/recurring-transactions');
    return response.data.data;
  },

  getById: async (id: string): Promise<RecurringTransaction> => {
    const response = await apiClient.get<ApiResponse<RecurringTransaction>>(`/recurring-transactions/${id}`);
    return response.data.data;
  },

  create: async (data: CreateRecurringTransactionInput): Promise<RecurringTransaction> => {
    const response = await apiClient.post<ApiResponse<RecurringTransaction>>('/recurring-transactions', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateRecurringTransactionInput>): Promise<RecurringTransaction> => {
    const response = await apiClient.patch<ApiResponse<RecurringTransaction>>(`/recurring-transactions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recurring-transactions/${id}`);
  },
};
