import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '../lib/api/admin.api';
import { queryKeys } from '../lib/constants/query-keys';

export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.admin.all,
    queryFn: getAdminStats,
  });
};
