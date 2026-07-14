import apiClient from './client';

export interface AdminStats {
  users: number;
  transactions: number;
  budgets: number;
  reminders: number;
  totalIncome: number;
  totalExpense: number;
  onlineUsers: number;
  activeToday: number;
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
  return response.data;
};
