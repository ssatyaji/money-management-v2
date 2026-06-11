export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
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
  accountId: string | null;
  account?: { id: string; name: string; color: string | null } | null;
  destinationAccountId?: string | null;
  destinationAccount?: { id: string; name: string; color: string | null } | null;
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
  accountId?: string;
  destinationAccountId?: string;
}
