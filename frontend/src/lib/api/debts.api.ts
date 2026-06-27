import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';

// ─── Debt Types ─────────────────────────────────────────────────────────────

export interface DebtPayment {
  id: string;
  amount: number;
  note: string | null;
  date: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  personName: string;
  personContact: string | null;
  description: string | null;
  type: 'RECEIVABLE' | 'PAYABLE';
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progress: number;
  status: 'ACTIVE' | 'PARTIALLY_PAID' | 'SETTLED' | 'CANCELLED';
  isOverdue: boolean;
  daysUntilDue: number | null;
  dueDate: string | null;
  borrowDate: string;
  settledAt: string | null;
  userId: string;
  payments?: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface DebtSummary {
  totalReceivable: number;
  totalPayable: number;
  netPosition: number;
  totalDebts: number;
  activeDebts: number;
  settledDebts: number;
  overdueCount: number;
}

export interface CreateDebtInput {
  personName: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  totalAmount: number;
  description?: string;
  personContact?: string;
  dueDate?: string;
  borrowDate?: string;
}

export interface AddPaymentInput {
  amount: number;
  note?: string;
  date?: string;
}

// ─── Debts API ──────────────────────────────────────────────────────────────

export const debtsApi = {
  getAll: async (type?: string, status?: string): Promise<Debt[]> => {
    const response = await apiClient.get<ApiResponse<Debt[]>>('/debts', {
      params: { ...(type && { type }), ...(status && { status }) },
    });
    return response.data.data;
  },

  getSummary: async (): Promise<DebtSummary> => {
    const response = await apiClient.get<ApiResponse<DebtSummary>>('/debts/summary');
    return response.data.data;
  },

  getById: async (id: string): Promise<Debt> => {
    const response = await apiClient.get<ApiResponse<Debt>>(`/debts/${id}`);
    return response.data.data;
  },

  create: async (data: CreateDebtInput): Promise<Debt> => {
    const response = await apiClient.post<ApiResponse<Debt>>('/debts', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateDebtInput>): Promise<Debt> => {
    const response = await apiClient.patch<ApiResponse<Debt>>(`/debts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/debts/${id}`);
  },

  addPayment: async (id: string, data: AddPaymentInput): Promise<Debt> => {
    const response = await apiClient.post<ApiResponse<Debt>>(`/debts/${id}/payments`, data);
    return response.data.data;
  },
};
