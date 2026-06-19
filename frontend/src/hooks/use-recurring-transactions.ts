import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringTransactionsApi, CreateRecurringTransactionInput } from '@/lib/api/recurring-transactions.api';

export function useRecurringTransactions() {
  return useQuery({
    queryKey: ['recurring-transactions', 'list'],
    queryFn: recurringTransactionsApi.getAll,
  });
}

export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringTransactionInput) => recurringTransactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'forecast'] }); // Projections change
    },
  });
}

export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRecurringTransactionInput> }) =>
      recurringTransactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'forecast'] });
    },
  });
}

export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recurringTransactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'forecast'] });
    },
  });
}
