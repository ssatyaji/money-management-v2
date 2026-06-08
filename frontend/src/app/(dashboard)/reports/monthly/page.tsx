'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
} from 'lucide-react';
import {
 
 
  BarChart,
  Bar,
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

import { formatCurrency } from '@/lib/utils/currency';
import { useMonthlyReport } from '@/hooks/use-budgets';

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
];

export default function MonthlyReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: report, isLoading } = useMonthlyReport(month, year);

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const expenseBreakdown = (report?.categoryBreakdown || [])
    .filter((c) => c.type === 'EXPENSE')
    .map((c, idx) => ({
      name: c.name,
      value: c.total,
      color: c.color || COLORS[idx % COLORS.length],
      icon: c.icon || '📦',
    }));

  const incomeBreakdown = (report?.categoryBreakdown || [])
    .filter((c) => c.type === 'INCOME');

  const chartData = (report?.dailyTrend || []).map((d) => ({
    date: d.date.slice(8), // DD
    Pemasukan: d.income,
    Pengeluaran: d.expense,
  }));

  const stats = [
    { label: 'Pemasukan', value: report?.totalIncome ?? 0, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Pengeluaran', value: report?.totalExpense ?? 0, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Saldo', value: report?.balance ?? 0, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Transaksi', value: report?.transactionCount ?? 0, icon: Receipt, color: 'text-purple-500', bg: 'bg-purple-500/10', isCurrency: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header with month picker */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Bulanan</h1>
          <p className="text-muted-foreground mt-1">Analisis keuangan detail per bulan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">{monthName}</span>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
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
              <p className="text-lg font-bold">
                {stat.isCurrency === false ? stat.value : formatCurrency(stat.value)}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ),
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Tren Harian</h3>
          {isLoading ? (
            <Skeleton className="w-full h-64" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Belum ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense Pie */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Kategori Pengeluaran</h3>
          {isLoading ? (
            <Skeleton className="w-full h-64" />
          ) : expenseBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Belum ada pengeluaran
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
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
              <div className="space-y-2 mt-3">
                {expenseBreakdown.slice(0, 6).map((item, idx) => (
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

      {/* Income Breakdown */}
      {incomeBreakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Sumber Pemasukan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {incomeBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <span>{item.icon || '💰'}</span>
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-emerald-500">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
