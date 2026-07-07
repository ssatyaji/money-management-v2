import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api/alerts.api';
import { queryKeys } from '@/lib/constants/query-keys';

export const useAlerts = () =>
  useQuery({
    queryKey: queryKeys.alerts,
    queryFn: alertsApi.getAlerts,
    staleTime: 60 * 1000,
  });

export const useMarkAlertRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsApi.markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
};

export const useMarkAllAlertsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsApi.markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
};
