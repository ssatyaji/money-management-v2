import apiClient from './client';

export interface AdminStats {
  users: number;
  transactions: number;
  budgets: number;
  reminders: number;
  totalIncome: number;
  totalExpense: number;
  totalPlatformExpense: number;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface PlatformExpense {
  id: string;
  description: string;
  amount: string | number; // Decimal from prisma is returned as string
  category: string;
  notes: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await apiClient.get('/admin/stats');
  return response.data.data || response.data;
};

export const getActivityLogs = async (params: {
  page: number;
  limit: number;
  search?: string;
  userId?: string;
  action?: string;
}): Promise<PaginatedResponse<ActivityLog>> => {
  const response = await apiClient.get('/admin/logs', { params });
  return response.data.data || response.data;
};

export const getPlatformExpenses = async (params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}): Promise<PaginatedResponse<PlatformExpense>> => {
  const response = await apiClient.get('/admin/expenses', { params });
  return response.data.data || response.data;
};

export const createPlatformExpense = async (data: {
  description: string;
  amount: number;
  category: string;
  notes?: string;
  date?: string;
}): Promise<{ success: boolean; data: PlatformExpense }> => {
  const response = await apiClient.post('/admin/expenses', data);
  return response.data.data || response.data;
};

export const deletePlatformExpense = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/admin/expenses/${id}`);
  return response.data.data || response.data;
};
