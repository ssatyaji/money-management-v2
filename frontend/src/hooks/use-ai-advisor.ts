import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAdvisorApi } from '@/lib/api/ai-advisor.api';
import { queryKeys } from '@/lib/constants/query-keys';

export const useAiInsights = () =>
  useQuery({
    queryKey: queryKeys.aiInsights,
    queryFn: aiAdvisorApi.getInsights,
    staleTime: 10 * 60 * 1000,
  });

export const useGenerateInsights = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiAdvisorApi.generateInsights,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.aiInsights });
    },
  });
};
