'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import {
  savingGoalsApi,
  type CreateSavingGoalInput,
  type AddContributionInput,
} from '@/lib/api/saving-goals.api';

export function useSavingGoals() {
  return useQuery({
    queryKey: queryKeys.savingGoals.all,
    queryFn: savingGoalsApi.getAll,
  });
}

export function useSavingGoalSummary() {
  return useQuery({
    queryKey: queryKeys.savingGoals.summary,
    queryFn: savingGoalsApi.getSummary,
  });
}

export function useSavingGoalDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.savingGoals.detail(id),
    queryFn: () => savingGoalsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSavingGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSavingGoalInput) => savingGoalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.summary });
    },
  });
}

export function useUpdateSavingGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSavingGoalInput> }) =>
      savingGoalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.summary });
    },
  });
}

export function useDeleteSavingGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savingGoalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.summary });
    },
  });
}

export function useAddContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: AddContributionInput }) =>
      savingGoalsApi.addContribution(goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.summary });
    },
  });
}
