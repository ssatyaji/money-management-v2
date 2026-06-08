export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters: object) => ['transactions', 'list', filters] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    byType: (type: string) => ['categories', 'type', type] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    summary: ['budgets', 'summary'] as const,
    detail: (id: string) => ['budgets', 'detail', id] as const,
  },
  reports: {
    monthly: (month: number, year: number) => ['reports', 'monthly', month, year] as const,
    yearly: (year: number) => ['reports', 'yearly', year] as const,
  },
  reminders: {
    all: ['reminders'] as const,
    detail: (id: string) => ['reminders', 'detail', id] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
    chart: ['dashboard', 'chart'] as const,
    categoryBreakdown: ['dashboard', 'category-breakdown'] as const,
  },
  ocr: {
    status: (id: string) => ['ocr', 'status', id] as const,
    result: (id: string) => ['ocr', 'result', id] as const,
  },
  bankStatements: {
    all: ['bank-statements'] as const,
    detail: (id: string) => ['bank-statements', 'detail', id] as const,
    transactions: (id: string) => ['bank-statements', 'transactions', id] as const,
  },
} as const;

