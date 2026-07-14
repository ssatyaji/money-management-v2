import { useQuery } from '@tanstack/react-query';
import { getAdminStats, getActivityLogs } from '../lib/api/admin.api';
import { queryKeys } from '../lib/constants/query-keys';

export const useAdminStats = (options?: { refetchInterval?: number }) => {
  return useQuery({
    queryKey: queryKeys.admin.all,
    queryFn: getAdminStats,
    ...options,
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
