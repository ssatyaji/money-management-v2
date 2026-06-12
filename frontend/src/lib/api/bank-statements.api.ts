import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type {
  BankName,
  BankStatement,
  ParsedTransaction,
  UploadStatementResult,
  ImportTransactionsResult,
} from '@/types/bank-statement.types';

export const bankStatementsApi = {
  /**
   * Upload and parse a bank e-statement PDF.
   */
  upload: async (bankName: BankName, file: File): Promise<UploadStatementResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bankName', bankName);

    const response = await apiClient.post<ApiResponse<UploadStatementResult>>(
      '/bank-statements/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s timeout for PDF parsing
      },
    );
    return response.data.data;
  },

  /**
   * Get all bank statement uploads.
   */
  getAll: async (): Promise<BankStatement[]> => {
    const response = await apiClient.get<ApiResponse<BankStatement[]>>('/bank-statements');
    return response.data.data;
  },

  /**
   * Get bank statement detail.
   */
  getById: async (id: string): Promise<BankStatement> => {
    const response = await apiClient.get<ApiResponse<BankStatement>>(`/bank-statements/${id}`);
    return response.data.data;
  },

  /**
   * Get parsed transactions from a bank statement.
   */
  getTransactions: async (id: string): Promise<ParsedTransaction[]> => {
    const response = await apiClient.get<ApiResponse<ParsedTransaction[]>>(
      `/bank-statements/${id}/transactions`,
    );
    return response.data.data;
  },

  /**
   * Import selected parsed transactions.
   */
  importTransactions: async (
    id: string,
    data: {
      transactionIds: string[];
      categoryMap?: Record<string, string>;
      accountId?: string;
      accountMap?: Record<string, string>;
    },
  ): Promise<ImportTransactionsResult> => {
    const response = await apiClient.post<ApiResponse<ImportTransactionsResult>>(
      `/bank-statements/${id}/import`,
      data,
    );
    return response.data.data;
  },
};
