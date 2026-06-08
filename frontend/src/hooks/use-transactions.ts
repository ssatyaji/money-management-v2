'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import {
  categoriesApi,
  transactionsApi,
  type TransactionFilters,
} from '@/lib/api/transactions.api';
import type { CreateTransactionInput } from '@/types/transaction.types';

// ─── Categories Hooks ────────────────────────────────────────────────────────

export function useCategories(type?: string) {
  return useQuery({
    queryKey: type ? queryKeys.categories.byType(type) : queryKeys.categories.all,
    queryFn: () => categoriesApi.getAll(type),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

// ─── Transactions Hooks ──────────────────────────────────────────────────────

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionsApi.getAll(filters),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.categoryBreakdown });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionInput> }) =>
      transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}

// ─── Dashboard Hooks ─────────────────────────────────────────────────────────

export function useTransactionSummary(month: number, year: number) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.summary, month, year],
    queryFn: () => transactionsApi.getSummary(month, year),
  });
}

export function useCategoryBreakdown(month: number, year: number, type: string = 'EXPENSE') {
  return useQuery({
    queryKey: [...queryKeys.dashboard.categoryBreakdown, month, year, type],
    queryFn: () => transactionsApi.getCategoryBreakdown(month, year, type),
  });
}

export function useDailyTrend(month: number, year: number) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.chart, month, year],
    queryFn: () => transactionsApi.getDailyTrend(month, year),
  });
}

export function useRecentTransactions(limit: number = 5) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: () => transactionsApi.getRecent(limit),
  });
}
