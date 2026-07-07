import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports.api';
import { queryKeys } from '@/lib/constants/query-keys';

export const useMonthPredictor = () =>
  useQuery({
    queryKey: queryKeys.monthPredictor,
    queryFn: reportsApi.getMonthPredictor,
    staleTime: 5 * 60 * 1000,
  });
