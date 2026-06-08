'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { useYearlyReport } from '@/hooks/use-budgets';

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
];

export default function YearlyReportPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: report, isLoading } = useYearlyReport(year);

  const monthlyChart = (report?.months || []).map((m) => ({
    name: m.name,
    Pemasukan: m.income,
    Pengeluaran: m.expense,
    Saldo: m.balance,
  }));

  const expenseBreakdown = (report?.categoryBreakdown || [])
    .filter((c) => c.type === 'EXPENSE')
    .slice(0, 10)
    .map((c, idx) => ({
      name: c.name,
      value: c.total,
      color: c.color || COLORS[idx % COLORS.length],
      icon: c.icon || '📦',
    }));

  const stats = [
    { label: 'Total Pemasukan', value: report?.totalIncome ?? 0, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total Pengeluaran', value: report?.totalExpense ?? 0, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Saldo Tahunan', value: report?.balance ?? 0, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Rata-rata/bulan', value: report?.avgMonthlyExpense ?? 0, icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Tahunan</h1>
          <p className="text-muted-foreground mt-1">Perbandingan keuangan per bulan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setYear(year - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">{year}</span>
          <Button variant="outline" size="icon" onClick={() => setYear(year + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) =>
          isLoading ? (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <Skeleton className="w-8 h-8 rounded-lg mb-2" />
              <Skeleton className="w-24 h-6 mb-1" />
              <Skeleton className="w-16 h-3" />
            </div>
          ) : (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <div className={`p-2 rounded-lg ${stat.bg} w-fit mb-2`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold">{formatCurrency(stat.value)}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ),
        )}
      </div>

      {/* Monthly Comparison Bar Chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Perbandingan Bulanan</h3>
        {isLoading ? (
          <Skeleton className="w-full h-72" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Bar dataKey="Pemasukan" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Balance Trend Line */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Tren Saldo Bulanan</h3>
        {isLoading ? (
          <Skeleton className="w-full h-48" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Line type="monotone" dataKey="Saldo" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Top 10 Kategori Pengeluaran</h3>
          {isLoading ? (
            <Skeleton className="w-full h-48" />
          ) : expenseBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Belum ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, idx) => (
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
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Detail Kategori</h3>
          {expenseBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Belum ada data
            </div>
          ) : (
            <div className="space-y-3">
              {expenseBreakdown.map((item, idx) => {
                const maxVal = expenseBreakdown[0]?.value || 1;
                const pct = Math.round((item.value / maxVal) * 100);
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
