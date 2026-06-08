export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionSource = 'MANUAL' | 'OCR' | 'BANK_IMPORT';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  note: string | null;
  date: string;
  receipt: string | null;
  source: TransactionSource;
  categoryId: string;
  category: Category;
  userId: string;
  bankStatementId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: TransactionType;
  isDefault: boolean;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  description?: string;
  note?: string;
  date: string;
  categoryId: string;
}
