import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';

export interface Account {
  id: string;
  name: string;
  color: string | null;
  startingBalance: number;
  balance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  name: string;
  color?: string;
  startingBalance?: number;
}

export const accountsApi = {
  getAll: async (): Promise<Account[]> => {
    const response = await apiClient.get<ApiResponse<Account[]>>('/accounts');
    return response.data.data;
  },

  getById: async (id: string): Promise<Account> => {
    const response = await apiClient.get<ApiResponse<Account>>(`/accounts/${id}`);
    return response.data.data;
  },

  create: async (data: CreateAccountInput): Promise<Account> => {
    const response = await apiClient.post<ApiResponse<Account>>('/accounts', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateAccountInput>): Promise<Account> => {
    const response = await apiClient.patch<ApiResponse<Account>>(`/accounts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },
};
