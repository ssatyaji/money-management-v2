import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankStatementsApi } from '@/lib/api/bank-statements.api';
import { queryKeys } from '@/lib/constants/query-keys';
import type { BankName } from '@/types/bank-statement.types';

/**
 * Query hook for fetching all bank statement uploads.
 */
export function useBankStatements() {
  return useQuery({
    queryKey: queryKeys.bankStatements.all,
    queryFn: () => bankStatementsApi.getAll(),
  });
}

/**
 * Query hook for fetching parsed transactions from a bank statement.
 */
export function useParsedTransactions(statementId: string | null) {
  return useQuery({
    queryKey: queryKeys.bankStatements.transactions(statementId || ''),
    queryFn: () => bankStatementsApi.getTransactions(statementId!),
    enabled: !!statementId,
  });
}

/**
 * Mutation hook for uploading a bank statement PDF.
 */
export function useUploadStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bankName, file }: { bankName: BankName; file: File }) =>
      bankStatementsApi.upload(bankName, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankStatements.all });
    },
  });
}

/**
 * Mutation hook for importing selected parsed transactions.
 */
export function useImportTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      statementId,
      transactionIds,
      categoryMap,
      accountId,
      accountMap,
    }: {
      statementId: string;
      transactionIds: string[];
      categoryMap?: Record<string, string>;
      accountId?: string;
      accountMap?: Record<string, string>;
    }) =>
      bankStatementsApi.importTransactions(statementId, {
        transactionIds,
        categoryMap,
        accountId,
        accountMap,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankStatements.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
