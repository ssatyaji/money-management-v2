import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type { OcrUploadResult, OcrStatus, OcrResult } from '@/types/bank-statement.types';

export const ocrApi = {
  /**
   * Upload a receipt image for OCR processing.
   */
  uploadReceipt: async (file: File, description?: string): Promise<OcrUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post<ApiResponse<OcrUploadResult>>('/ocr/receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60s timeout for OCR processing
    });
    return response.data.data;
  },

  /**
   * Get OCR processing status.
   */
  getStatus: async (id: string): Promise<OcrStatus> => {
    const response = await apiClient.get<ApiResponse<OcrStatus>>(`/ocr/receipt/${id}/status`);
    return response.data.data;
  },

  /**
   * Get OCR result.
   */
  getResult: async (id: string): Promise<OcrResult> => {
    const response = await apiClient.get<ApiResponse<OcrResult>>(`/ocr/receipt/${id}/result`);
    return response.data.data;
  },
};
