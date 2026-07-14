import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminStats,
  getActivityLogs,
  getPlatformExpenses,
  createPlatformExpense,
  deletePlatformExpense,
} from '../lib/api/admin.api';
import { queryKeys } from '../lib/constants/query-keys';

export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.admin.all,
    queryFn: getAdminStats,
  });
};

export const useActivityLogs = (params: {
  page: number;
  limit: number;
  search?: string;
  userId?: string;
  action?: string;
}) => {
  return useQuery({
    queryKey: ['admin', 'logs', params],
    queryFn: () => getActivityLogs(params),
  });
};

export const usePlatformExpenses = (params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: ['admin', 'expenses', params],
    queryFn: () => getPlatformExpenses(params),
  });
};

export const useCreatePlatformExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlatformExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'expenses'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
};

export const useDeletePlatformExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlatformExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'expenses'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
};
