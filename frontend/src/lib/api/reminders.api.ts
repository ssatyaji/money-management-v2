import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  ReminderFilter,
} from '@/types/reminder.types';

export const remindersApi = {
  getAll: async (filter?: ReminderFilter): Promise<Reminder[]> => {
    const params = filter ? { filter } : {};
    const response = await apiClient.get<ApiResponse<Reminder[]>>('/reminders', { params });
    return response.data.data;
  },

  getUpcoming: async (): Promise<Reminder[]> => {
    const response = await apiClient.get<ApiResponse<Reminder[]>>('/reminders/upcoming');
    return response.data.data;
  },

  getOverdue: async (): Promise<Reminder[]> => {
    const response = await apiClient.get<ApiResponse<Reminder[]>>('/reminders/overdue');
    return response.data.data;
  },

  getById: async (id: string): Promise<Reminder> => {
    const response = await apiClient.get<ApiResponse<Reminder>>(`/reminders/${id}`);
    return response.data.data;
  },

  create: async (data: CreateReminderInput): Promise<Reminder> => {
    const response = await apiClient.post<ApiResponse<Reminder>>('/reminders', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateReminderInput): Promise<Reminder> => {
    const response = await apiClient.patch<ApiResponse<Reminder>>(`/reminders/${id}`, data);
    return response.data.data;
  },

  markComplete: async (id: string): Promise<void> => {
    await apiClient.patch(`/reminders/${id}/complete`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reminders/${id}`);
  },
};
