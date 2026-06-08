export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  TRANSACTIONS_NEW: '/transactions/new',
  BUDGETS: '/budgets',
  BUDGETS_NEW: '/budgets/new',
  REPORTS_MONTHLY: '/reports/monthly',
  REPORTS_YEARLY: '/reports/yearly',
  REMINDERS: '/reminders',
  REMINDERS_NEW: '/reminders/new',
  SCAN_RECEIPT: '/scan/receipt',
  SCAN_STATEMENT: '/scan/statement',
  SETTINGS: '/settings',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
} as const;

export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.HOME];
export const ADMIN_ROUTES = [ROUTES.ADMIN_USERS, ROUTES.ADMIN_ANALYTICS];
