'use client';

import { useState } from 'react';
import Link from 'next/link';

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
    { label: 'Pemasukan', value: report?.totalIncome ?? 0, icon: 'trending_up', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Pengeluaran', value: report?.totalExpense ?? 0, icon: 'trending_down', color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Saldo', value: report?.balance ?? 0, icon: 'account_balance_wallet', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Transaksi', value: report?.transactionCount ?? 0, icon: 'receipt_long', color: 'text-purple-500', bg: 'bg-purple-500/10', isCurrency: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header with month picker and switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan Bulanan</h1>
          <p className="text-muted-foreground mt-1">Analisis keuangan detail per bulan</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Segmented Switcher */}
          <div className="flex bg-muted p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <Link
              href="/reports/monthly"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-card shadow-sm text-foreground"
            >
              Bulanan
            </Link>
            <Link
              href="/reports/yearly"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Tahunan
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-border bg-card" onClick={handlePrev}>
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </Button>
            <span className="text-h3 min-w-[140px] text-center">{monthName}</span>
            <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-border bg-card" onClick={handleNext}>
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) =>
          isLoading ? (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
              <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mb-2 sm:mb-3" />
              <Skeleton className="w-16 sm:w-24 h-6 sm:h-8 mb-1 sm:mb-2" />
              <Skeleton className="w-10 sm:w-16 h-3 sm:h-4" />
            </div>
          ) : (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-3 sm:p-5 card-hover shadow-[0px_4px_12px_rgba(26,43,60,0.05)] flex flex-col justify-between min-w-0">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${stat.bg} mb-2 sm:mb-4`}>
                <span className={`material-symbols-outlined text-lg sm:text-xl ${stat.color}`}>{stat.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-numeric-lg font-bold text-foreground tracking-tight truncate">
                  {stat.isCurrency === false ? stat.value : formatCurrency(stat.value)}
                </p>
                <p className="text-xs sm:text-body-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">{stat.label}</p>
              </div>
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
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
