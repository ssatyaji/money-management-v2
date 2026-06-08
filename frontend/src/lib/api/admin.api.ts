import apiClient from './client';

export interface AdminStats {
  users: number;
  transactions: number;
  budgets: number;
  reminders: number;
  totalIncome: number;
  totalExpense: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await apiClient.get('/admin/stats');
  return response.data.data || response.data;
};
