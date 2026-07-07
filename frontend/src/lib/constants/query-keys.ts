export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  monthPredictor: ['month-predictor'] as const,
  alerts: ['alerts'] as const,
  aiInsights: ['ai-insights'] as const,
  aiSession: (id: string) => ['ai-session', id] as const,
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
  admin: {
    all: ['admin'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    detail: (id: string) => ['accounts', 'detail', id] as const,
  },
  savingGoals: {
    all: ['saving-goals'] as const,
    summary: ['saving-goals', 'summary'] as const,
    detail: (id: string) => ['saving-goals', 'detail', id] as const,
  },
  debts: {
    all: ['debts'] as const,
    summary: ['debts', 'summary'] as const,
    detail: (id: string) => ['debts', 'detail', id] as const,
  },
  investments: {
    assets: ['investments', 'assets'] as const,
    portfolio: ['investments', 'portfolio'] as const,
    assetDetail: (id: string) => ['investments', 'assets', id] as const,
  },
} as const;
