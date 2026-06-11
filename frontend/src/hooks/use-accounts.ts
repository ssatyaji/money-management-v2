'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import { accountsApi, type CreateAccountInput } from '@/lib/api/accounts.api';

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: accountsApi.getAll,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: () => accountsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountInput) => accountsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAccountInput> }) =>
      accountsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}
