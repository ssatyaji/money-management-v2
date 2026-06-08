'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import { budgetsApi, reportsApi, type CreateBudgetInput } from '@/lib/api/budgets.api';

// ─── Budgets Hooks ───────────────────────────────────────────────────────────

export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: budgetsApi.getAll,
  });
}

export function useActiveBudgets() {
  return useQuery({
    queryKey: [...queryKeys.budgets.all, 'active'],
    queryFn: budgetsApi.getActive,
  });
}

export function useBudgetSummary() {
  return useQuery({
    queryKey: queryKeys.budgets.summary,
    queryFn: budgetsApi.getSummary,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetInput) => budgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.summary });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBudgetInput> }) =>
      budgetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.summary });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: budgetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.summary });
    },
  });
}

// ─── Reports Hooks ───────────────────────────────────────────────────────────

export function useMonthlyReport(month: number, year: number) {
  return useQuery({
    queryKey: queryKeys.reports.monthly(month, year),
    queryFn: () => reportsApi.getMonthly(month, year),
  });
}

export function useYearlyReport(year: number) {
  return useQuery({
    queryKey: queryKeys.reports.yearly(year),
    queryFn: () => reportsApi.getYearly(year),
  });
}
