'use client';

import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
 
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
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

  const stats = [
    {
      label: 'Total Pemasukan',
      value: summary?.totalIncome ?? 0,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      trend: 'up' as const,
    },
    {
      label: 'Total Pengeluaran',
      value: summary?.totalExpense ?? 0,
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      trend: 'down' as const,
    },
    {
      label: 'Saldo',
      value: summary?.balance ?? 0,
      icon: Wallet,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: (summary?.balance ?? 0) >= 0 ? ('up' as const) : ('down' as const),
    },
  ];

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Ringkasan keuangan bulan {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/transactions/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Transaksi</span>
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) =>
          loadingSummary ? (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="w-10 h-10 rounded-lg mb-3" />
              <Skeleton className="w-32 h-7 mb-1" />
              <Skeleton className="w-24 h-4" />
            </div>
          ) : (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-5 card-hover"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full',
                    stat.trend === 'up'
                      ? 'text-emerald-600 bg-emerald-500/10'
                      : 'text-red-600 bg-red-500/10',
                  )}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  Bulan ini
                </span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(stat.value)}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor} rounded-full blur-3xl opacity-20 -translate-y-8 translate-x-8`} />
            </div>
          ),
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Trend Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Pemasukan vs Pengeluaran</h3>
          {loadingTrend ? (
            <Skeleton className="w-full h-64" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Belum ada data transaksi bulan ini
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Breakdown Pie */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Kategori Pengeluaran</h3>
          {loadingBreakdown ? (
            <Skeleton className="w-full h-64" />
          ) : pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Belum ada data pengeluaran
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.icon} {item.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-6 pb-3">
          <h3 className="font-semibold">Transaksi Terakhir</h3>
          <Link href="/transactions" className="text-sm text-primary hover:underline">
            Lihat semua →
          </Link>
        </div>

        {loadingRecent ? (
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                </div>
                <Skeleton className="w-24 h-5" />
              </div>
            ))}
          </div>
        ) : !recentTx || recentTx.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Belum ada transaksi. Mulai catat sekarang!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentTx.map((tx) => (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{
                      backgroundColor: tx.category?.color
                        ? `${tx.category.color}15`
                        : undefined,
                    }}
                  >
                    {tx.category?.icon || '📦'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {tx.description || tx.category?.name || 'Transaksi'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTransactionDate(tx.date)} · {tx.category?.name}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    tx.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500',
                  )}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(Number(tx.amount))}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
