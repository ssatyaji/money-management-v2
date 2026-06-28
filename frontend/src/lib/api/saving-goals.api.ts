import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';

// ─── Saving Goals Types ─────────────────────────────────────────────────────

export interface GoalContribution {
  id: string;
  amount: number;
  note: string | null;
  date: string;
  createdAt: string;
}

export interface SavingGoal {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  goalType: 'SAVE_UP' | 'PAY_OFF';
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  monthlyTarget: number | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  completedAt: string | null;
  progress: number;
  remainingAmount: number;
  suggestedMonthly: number | null;
  daysRemaining: number | null;
  userId: string;
  contributions?: GoalContribution[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTarget: number;
  totalSaved: number;
  overallProgress: number;
}

export interface CreateSavingGoalInput {
  name: string;
  goalType: 'SAVE_UP' | 'PAY_OFF';
  targetAmount: number;
  description?: string;
  icon?: string;
  color?: string;
  deadline?: string;
  monthlyTarget?: number;
}

export interface AddContributionInput {
  amount: number;
  accountId: string;
  note?: string;
  date?: string;
}

export interface CompleteGoalInput {
  action: 'WITHDRAW' | 'SPEND';
  targetId: string;
  amount?: number;
}

// ─── Saving Goals API ───────────────────────────────────────────────────────

export const savingGoalsApi = {
  getAll: async (): Promise<SavingGoal[]> => {
    const response = await apiClient.get<ApiResponse<SavingGoal[]>>('/saving-goals');
    return response.data.data;
  },

  getSummary: async (): Promise<GoalSummary> => {
    const response = await apiClient.get<ApiResponse<GoalSummary>>('/saving-goals/summary');
    return response.data.data;
  },

  getById: async (id: string): Promise<SavingGoal> => {
    const response = await apiClient.get<ApiResponse<SavingGoal>>(`/saving-goals/${id}`);
    return response.data.data;
  },

  create: async (data: CreateSavingGoalInput): Promise<SavingGoal> => {
    const response = await apiClient.post<ApiResponse<SavingGoal>>('/saving-goals', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateSavingGoalInput>): Promise<SavingGoal> => {
    const response = await apiClient.patch<ApiResponse<SavingGoal>>(`/saving-goals/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/saving-goals/${id}`);
  },

  addContribution: async (id: string, data: AddContributionInput): Promise<SavingGoal> => {
    const response = await apiClient.post<ApiResponse<SavingGoal>>(`/saving-goals/${id}/contribute`, data);
    return response.data.data;
  },

  complete: async (id: string, data: CompleteGoalInput): Promise<SavingGoal> => {
    const response = await apiClient.post<ApiResponse<SavingGoal>>(`/saving-goals/${id}/complete`, data);
    return response.data.data;
  },
};
