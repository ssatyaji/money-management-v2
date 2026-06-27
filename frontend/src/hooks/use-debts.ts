'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import {
  debtsApi,
  type CreateDebtInput,
  type AddPaymentInput,
} from '@/lib/api/debts.api';

export function useDebts(type?: string, status?: string) {
  return useQuery({
    queryKey: [...queryKeys.debts.all, type, status],
    queryFn: () => debtsApi.getAll(type, status),
  });
}

export function useDebtSummary() {
  return useQuery({
    queryKey: queryKeys.debts.summary,
    queryFn: debtsApi.getSummary,
  });
}

export function useDebtDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.debts.detail(id),
    queryFn: () => debtsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDebtInput) => debtsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.summary });
    },
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDebtInput> }) =>
      debtsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.summary });
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: debtsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.summary });
    },
  });
}

export function useAddDebtPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: AddPaymentInput }) =>
      debtsApi.addPayment(debtId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.summary });
    },
  });
}
