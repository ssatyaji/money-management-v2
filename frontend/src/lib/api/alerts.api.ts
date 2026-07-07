import apiClient from './client';
import { ApiResponse } from '@/types/api.types';

export interface AlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  expiresAt: string;
}

export const alertsApi = {
  getAlerts: async (): Promise<AlertItem[]> => {
    const res = await apiClient.get<ApiResponse<AlertItem[]>>('/alerts');
    return res.data.data;
  },
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/alerts/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/alerts/read-all');
  },
  refresh: async (): Promise<void> => {
    await apiClient.post('/alerts/refresh');
  },
};
