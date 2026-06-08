import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ocrApi } from '@/lib/api/ocr.api';
import { queryKeys } from '@/lib/constants/query-keys';

/**
 * Mutation hook for uploading and processing a receipt image via OCR.
 */
export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, description }: { file: File; description?: string }) =>
      ocrApi.uploadReceipt(file, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankStatements.all });
    },
  });
}

/**
 * Mutation hook for getting OCR result by ID.
 */
export function useGetOcrResult() {
  return useMutation({
    mutationFn: (id: string) => ocrApi.getResult(id),
  });
}
