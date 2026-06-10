'use client';

import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatTransactionDate } from '@/lib/utils/date';
import {
  useTransactionSummary,
  useCategoryBreakdown,
  useDailyTrend,
  useRecentTransactions,
} from '@/hooks/use-transactions';

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
];

export default function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: summary, isLoading: loadingSummary } = useTransactionSummary(month, year);
  const { data: breakdown, isLoading: loadingBreakdown } = useCategoryBreakdown(month, year);
  const { data: dailyTrend, isLoading: loadingTrend } = useDailyTrend(month, year);
  const { data: recentTx, isLoading: loadingRecent } = useRecentTransactions(7);

  const pieData = (breakdown || []).map((item, idx) => ({
    name: item.category?.name || 'Lainnya',
    value: Number(item.total) || 0,
    color: item.category?.color || COLORS[idx % COLORS.length],
    icon: item.category?.icon || '📦',
  }));

  const chartData = (dailyTrend || []).map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    Pemasukan: d.income,
    Pengeluaran: d.expense,
  }));

  const balance = summary?.balance ?? 0;
  const isPositive = balance >= 0;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Balance Card (Primary Bento Item) */}
      <div className="w-full relative overflow-hidden rounded-[24px] p-6 text-primary-foreground shadow-lg flex flex-col justify-between min-h-[160px] animate-in fade-in slide-in-from-bottom-4 duration-500 bg-primary">
        <div className="flex items-center justify-between opacity-80 mb-2 z-10">
          <span className="font-body-md text-sm uppercase tracking-wider font-semibold">Total Balance</span>
          <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
        </div>
        <div className="font-numeric-lg text-[32px] md:text-[40px] font-bold tracking-tight z-10">
          {loadingSummary ? <Skeleton className="w-48 h-10 bg-primary-foreground/20" /> : formatCurrency(balance)}
        </div>
        <div className="flex items-center gap-1 opacity-90 mt-2 z-10">
          <span className="material-symbols-outlined text-[16px]">
            {isPositive ? 'trending_up' : 'trending_down'}
          </span>
          <span className="font-body-sm text-sm">
            {isPositive ? 'Positive balance' : 'Negative balance'}
          </span>
        </div>
        
        {/* Background ambient decorative shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary opacity-20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
      </div>

      {/* Quick Actions Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Link href="/transactions/new?type=INCOME" className="group flex flex-col items-center justify-center gap-2 p-4 bg-card border border-border rounded-[20px] shadow-[0px_2px_8px_rgba(26,43,60,0.04)] hover:shadow-[0px_8px_24px_rgba(26,43,60,0.08)] transition-all duration-300 hover:-translate-y-1 active:scale-95">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-[24px]">arrow_downward</span>
          </div>
          <span className="font-body-sm text-sm font-semibold text-foreground">Income</span>
        </Link>
        <Link href="/transactions/new?type=EXPENSE" className="group flex flex-col items-center justify-center gap-2 p-4 bg-card border border-border rounded-[20px] shadow-[0px_2px_8px_rgba(26,43,60,0.04)] hover:shadow-[0px_8px_24px_rgba(26,43,60,0.08)] transition-all duration-300 hover:-translate-y-1 active:scale-95">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-[24px]">arrow_upward</span>
          </div>
          <span className="font-body-sm text-sm font-semibold text-foreground">Expense</span>
        </Link>
        <Link href="/transactions" className="group flex flex-col items-center justify-center gap-2 p-4 bg-card border border-border rounded-[20px] shadow-[0px_2px_8px_rgba(26,43,60,0.04)] hover:shadow-[0px_8px_24px_rgba(26,43,60,0.08)] transition-all duration-300 hover:-translate-y-1 active:scale-95">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
          </div>
          <span className="font-body-sm text-sm font-semibold text-foreground">History</span>
        </Link>
        <Link href="/transactions/new" className="group flex flex-col items-center justify-center gap-2 p-4 bg-primary text-primary-foreground rounded-[20px] shadow-[0px_4px_12px_rgba(26,43,60,0.15)] hover:shadow-[0px_8px_24px_rgba(26,43,60,0.2)] transition-all duration-300 hover:-translate-y-1 active:scale-95 relative overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </div>
          <span className="font-body-sm text-sm font-bold">New</span>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Stat */}
        <div className="p-6 bg-card border border-border rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
              <span className="font-body-sm font-semibold">Income</span>
            </div>
          </div>
          <div className="text-3xl font-heading font-bold text-foreground">
            {loadingSummary ? <Skeleton className="w-32 h-8" /> : formatCurrency(summary?.totalIncome ?? 0)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Total income this month</p>
        </div>

        {/* Expense Stat */}
        <div className="p-6 bg-card border border-border rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10">
                <span className="material-symbols-outlined text-[20px]">trending_down</span>
              </div>
              <span className="font-body-sm font-semibold">Expense</span>
            </div>
          </div>
          <div className="text-3xl font-heading font-bold text-foreground">
            {loadingSummary ? <Skeleton className="w-32 h-8" /> : formatCurrency(summary?.totalExpense ?? 0)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Total expense this month</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 p-6 bg-card border border-border rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)]">
          <h3 className="font-h3 text-xl font-bold text-foreground mb-6">Cashflow Overview</h3>
          {loadingTrend ? (
            <Skeleton className="w-full h-[260px]" />
          ) : chartData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              No transactions yet this month
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0px 8px 24px rgba(26,43,60,0.12)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" fill="url(#colorIncome)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" fill="url(#colorExpense)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expenses Pie */}
        <div className="p-6 bg-card border border-border rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)]">
          <h3 className="font-h3 text-xl font-bold text-foreground mb-6">Top Expenses</h3>
          {loadingBreakdown ? (
            <Skeleton className="w-full h-[260px]" />
          ) : pieData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              No expenses to show
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0px 8px 24px rgba(26,43,60,0.12)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--foreground)'
                    }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-4">
                {pieData.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-foreground font-medium">{item.icon} {item.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="w-full bg-card border border-border rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
          <h3 className="font-h3 text-xl font-bold text-foreground">Recent Activity</h3>
          <Link href="/transactions" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            See All <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>

        <div className="p-2">
          {loadingRecent ? (
            <div className="p-4 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-20 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-24 h-5" />
                </div>
              ))}
            </div>
          ) : !recentTx || recentTx.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <span className="material-symbols-outlined text-[32px]">receipt_long</span>
              </div>
              <p className="text-foreground font-semibold">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-1">Your recent activity will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {recentTx.map((tx) => (
                <Link
                  key={tx.id}
                  href={`/transactions/${tx.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-[16px] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm border border-border/50 group-hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: tx.category?.color ? `${tx.category.color}15` : 'var(--muted)',
                      }}
                    >
                      {tx.category?.icon || '📦'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm md:text-base">
                        {tx.description || tx.category?.name || 'Transaction'}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {tx.category?.name} • {formatTransactionDate(tx.date)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={cn(
                        'font-bold text-sm md:text-base',
                        tx.type === 'INCOME' ? 'text-emerald-600' : 'text-foreground'
                      )}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
