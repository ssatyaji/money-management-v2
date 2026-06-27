'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import {
  investmentsApi,
  type CreateAssetInput,
  type CreateInvestmentTxInput,
} from '@/lib/api/investments.api';

export function useInvestmentAssets() {
  return useQuery({
    queryKey: queryKeys.investments.assets,
    queryFn: investmentsApi.getAllAssets,
  });
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: queryKeys.investments.portfolio,
    queryFn: investmentsApi.getPortfolioSummary,
  });
}

export function useInvestmentAssetDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.investments.assetDetail(id),
    queryFn: () => investmentsApi.getAssetById(id),
    enabled: !!id,
  });
}

export function useCreateInvestmentAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetInput) => investmentsApi.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.assets });
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.portfolio });
    },
  });
}

export function useUpdateInvestmentAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssetInput> }) =>
      investmentsApi.updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.assets });
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.portfolio });
    },
  });
}

export function useDeleteInvestmentAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: investmentsApi.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.assets });
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.portfolio });
    },
  });
}

export function useAddInvestmentTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, data }: { assetId: string; data: CreateInvestmentTxInput }) =>
      investmentsApi.addTransaction(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.assets });
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.portfolio });
    },
  });
}
