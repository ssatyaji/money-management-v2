// ─── Bank Statement Types ───────────────────────────────────────────────────

export type BankName = 'PERMATA' | 'JAGO' | 'SEABANK' | 'BCA';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface BankStatement {
  id: string;
  fileName: string;
  bankName: BankName;
  status: ProcessingStatus;
  statementDate: string | null;
  processedAt: string | null;
  createdAt: string;
  errorMessage?: string | null;
  _count?: {
    transactions: number;
  };
}

export interface ParsedTransaction {
  tempId: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  balance?: number;
}

export interface UploadStatementResult {
  id: string;
  fileName: string;
  bankName: BankName;
  status: ProcessingStatus;
  transactionCount: number;
  statementDate?: string;
  accountNumber?: string;
}

export interface ImportTransactionsResult {
  imported: number;
  bankStatementId: string;
}

// ─── OCR Types ──────────────────────────────────────────────────────────────

export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ParsedReceipt {
  merchant: string | null;
  date: string | null;
  items: ParsedReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  rawText: string;
}

export interface OcrUploadResult {
  id: string;
  result: ParsedReceipt;
}

export interface OcrStatus {
  id: string;
  status: ProcessingStatus;
  processedAt: string | null;
  fileName: string;
}

export interface OcrResult {
  id: string;
  fileName: string;
  status: ProcessingStatus;
  processedAt: string | null;
  result: ParsedReceipt;
}

export interface OcrReceipt {
  id: string;
  fileName: string;
  status: ProcessingStatus;
  processedAt: string | null;
  description: string | null;
  result: ParsedReceipt | null;
  createdAt: string;
}

export const BANK_LABELS: Record<BankName, string> = {
  PERMATA: 'Bank Permata',
  JAGO: 'Bank Jago',
  SEABANK: 'SeaBank',
  BCA: 'Bank BCA',
};
