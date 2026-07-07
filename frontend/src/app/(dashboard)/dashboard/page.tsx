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
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatTransactionDate } from '@/lib/utils/date';
import { useState, useEffect } from 'react';
import {
  useTransactionSummary,
  useCategoryBreakdown,
  useDailyTrend,
  useRecentTransactions,
  useCashflowForecast,
} from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { useSavingGoalSummary } from '@/hooks/use-saving-goals';
import { useDebtSummary } from '@/hooks/use-debts';
import { usePortfolioSummary } from '@/hooks/use-investments';
import { MonthPredictorWidget } from '@/components/dashboard/month-predictor-widget';
import { AlertCards } from '@/components/dashboard/alert-cards';

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
];

export default function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [chartView, setChartView] = useState<'overview' | 'forecast'>('overview');
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('show_balance');
    if (stored !== null) {
      setShowBalance(stored === 'true');
    }
  }, []);

  const toggleBalance = () => {
    const nextValue = !showBalance;
    setShowBalance(nextValue);
    localStorage.setItem('show_balance', String(nextValue));
  };

  const { data: summary, isLoading: loadingSummary } = useTransactionSummary(month, year);
  const { data: breakdown, isLoading: loadingBreakdown } = useCategoryBreakdown(month, year);
  const { data: dailyTrend, isLoading: loadingTrend } = useDailyTrend(month, year);
  const { data: recentTx, isLoading: loadingRecent } = useRecentTransactions(7);
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: forecastData, isLoading: loadingForecast } = useCashflowForecast();
  const { data: savingSummary, isLoading: loadingSaving } = useSavingGoalSummary();
  const { data: debtSummary, isLoading: loadingDebts } = useDebtSummary();
  const { data: portfolioSummary, isLoading: loadingPortfolio } = usePortfolioSummary();

  const isLoading = loadingSummary || loadingBreakdown || loadingTrend || loadingRecent || loadingAccounts || loadingForecast || loadingSaving || loadingDebts || loadingPortfolio;

  if (isLoading) {
    return <SkeletonDashboard />;
  }

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

  const forecastChartData = (forecastData || []).map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    Saldo: d.balance,
  }));

  const totalCash = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  const totalSavings = Number(savingSummary?.totalSaved) || 0;
  const totalInvestments = Number(portfolioSummary?.totalCurrentValue) || 0;
  const totalReceivables = Number(debtSummary?.totalReceivable) || 0;
  const totalPayables = Number(debtSummary?.totalPayable) || 0;
  const netWorth = totalCash + totalSavings + totalInvestments + totalReceivables - totalPayables;
  const isPositive = netWorth >= 0;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Net Worth Card (Primary Bento Item) */}
      <div className="w-full relative overflow-hidden rounded-[24px] p-6 text-primary-foreground shadow-lg flex flex-col justify-between min-h-[180px] animate-in fade-in slide-in-from-bottom-4 duration-500 bg-primary">
        <div className="flex items-center justify-between opacity-80 mb-2 z-10">
          <span className="font-body-md text-sm uppercase tracking-wider font-semibold">Net Worth (Kekayaan Bersih)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleBalance}
              type="button"
              className="hover:text-white/80 transition-colors p-1 rounded-lg focus:outline-none flex items-center justify-center cursor-pointer"
              title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showBalance ? 'visibility' : 'visibility_off'}
              </span>
            </button>
            <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl md:text-[40px] font-bold tracking-tight z-10 truncate">
          {showBalance ? formatCurrency(netWorth) : 'Rp ••••••'}
        </div>
        <div className="flex items-center gap-1 opacity-90 mt-2 z-10">
          <span className="material-symbols-outlined text-[16px]">
            {isPositive ? 'trending_up' : 'trending_down'}
          </span>
          <span className="font-body-sm text-sm">
            {isPositive ? 'Kekayaan bersih positif' : 'Kekayaan bersih negatif'}
          </span>
        </div>

        {/* Assets Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 z-10">
          <div className="space-y-1">
            <p className="text-xs text-white/70 font-medium">💵 Kas & Dompet</p>
            <p className="text-sm sm:text-base font-bold text-white">
              {showBalance ? formatCurrency(totalCash) : 'Rp ••••••'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/70 font-medium">🎯 Tabungan (Goals)</p>
            <p className="text-sm sm:text-base font-bold text-white">
              {showBalance ? formatCurrency(totalSavings) : 'Rp ••••••'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/70 font-medium">📈 Investasi</p>
            <p className="text-sm sm:text-base font-bold text-white">
              {showBalance ? formatCurrency(totalInvestments) : 'Rp ••••••'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/70 font-medium">🤝 Hutang & Piutang</p>
            <p className="text-sm sm:text-base font-bold text-white">
              {showBalance ? `${(totalReceivables - totalPayables) >= 0 ? '+' : ''}${formatCurrency(totalReceivables - totalPayables)}` : 'Rp ••••••'}
            </p>
          </div>
        </div>
        
        {/* Background ambient decorative shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary opacity-20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
      </div>

      {/* Wallets / Accounts Section */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dompet Saya</h3>
            <Link href="/settings" className="text-xs font-semibold text-primary hover:underline">
              Kelola
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="min-w-[180px] sm:min-w-[220px] rounded-2xl border border-border/70 bg-card/65 backdrop-blur-md p-4 shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-300 flex flex-col justify-between relative overflow-hidden shrink-0"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: acc.color || '#3b82f6' }}
                />
                <div className="pl-1.5 space-y-1">
                  <p className="text-xs text-muted-foreground truncate font-medium">{acc.name}</p>
                  <p className="text-lg font-bold text-foreground truncate">
                    {showBalance ? formatCurrency(acc.balance) : 'Rp ••••••'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Link href="/transactions/new?type=INCOME" className="group flex flex-col items-center justify-center gap-2 p-4 bg-card/65 backdrop-blur-md border border-border/80 rounded-[20px] shadow-[0px_2px_8px_rgba(26,43,60,0.04)] hover:shadow-[0px_8px_24px_rgba(26,43,60,0.08)] transition-all duration-300 hover:-translate-y-1 active:scale-95">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-[24px]">arrow_downward</span>
          </div>
          <span className="font-body-sm text-sm font-semibold text-foreground">Income</span>
        </Link>
        <Link href="/transactions/new?type=EXPENSE" className="group flex flex-col items-center justify-center gap-2 p-4 bg-card/65 backdrop-blur-md border border-border/80 rounded-[20px] shadow-[0px_2px_8px_rgba(26,43,60,0.04)] hover:shadow-[0px_8px_24px_rgba(26,43,60,0.08)] transition-all duration-300 hover:-translate-y-1 active:scale-95">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-[24px]">arrow_upward</span>
          </div>
          <span className="font-body-sm text-sm font-semibold text-foreground">Expense</span>
        </Link>
        <Link href="/transactions" className="group flex flex-col items-center justify-center gap-2 p-4 bg-card/65 backdrop-blur-md border border-border/80 rounded-[20px] shadow-[0px_2px_8px_rgba(26,43,60,0.04)] hover:shadow-[0px_8px_24px_rgba(26,43,60,0.08)] transition-all duration-300 hover:-translate-y-1 active:scale-95">
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
        <div className="p-6 bg-card/65 backdrop-blur-md border border-border/80 rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] hover:scale-[1.01] hover:border-emerald-500/20 transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
              <span className="font-body-sm font-semibold">Income</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground truncate">
            {showBalance ? formatCurrency(summary?.totalIncome ?? 0) : 'Rp ••••••'}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Total income this month</p>
        </div>

        {/* Expense Stat */}
        <div className="p-6 bg-card/65 backdrop-blur-md border border-border/80 rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] hover:scale-[1.01] hover:border-emerald-500/20 transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10">
                <span className="material-symbols-outlined text-[20px]">trending_down</span>
              </div>
              <span className="font-body-sm font-semibold">Expense</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground truncate">
            {showBalance ? formatCurrency(summary?.totalExpense ?? 0) : 'Rp ••••••'}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Total expense this month</p>
        </div>
      </div>

      {/* Alert Notifications */}
      <AlertCards />

      {/* Month Predictor Widget */}
      <MonthPredictorWidget />

      {/* Feature Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saving Goals Widget */}
        <Link href="/goals" className="p-6 bg-card/65 backdrop-blur-md border border-border/80 rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] hover:scale-[1.01] hover:border-primary/20 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                <span className="material-symbols-outlined text-[20px]">target</span>
              </div>
              <span className="font-body-sm font-semibold">Saving Goals</span>
            </div>
            <span className="text-xs font-semibold text-primary">{savingSummary?.overallProgress ?? 0}%</span>
          </div>
          <div className="text-xl font-heading font-bold text-foreground truncate">
            {showBalance ? formatCurrency(savingSummary?.totalSaved ?? 0) : 'Rp ••••••'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Terkumpul dari target {showBalance ? formatCurrency(savingSummary?.totalTarget ?? 0) : 'Rp ••••••'}</p>
        </Link>

        {/* Debt Widget */}
        <Link href="/debts" className="p-6 bg-card/65 backdrop-blur-md border border-border/80 rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] hover:scale-[1.01] hover:border-primary/20 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                <span className="material-symbols-outlined text-[20px]">paid</span>
              </div>
              <span className="font-body-sm font-semibold">Hutang & Piutang</span>
            </div>
            {debtSummary?.overdueCount && debtSummary.overdueCount > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">{debtSummary.overdueCount} Overdue</span>
            ) : null}
          </div>
          <div className={cn("text-xl font-heading font-bold truncate", (debtSummary?.netPosition ?? 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
            {showBalance ? formatCurrency(debtSummary?.netPosition ?? 0) : 'Rp ••••••'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Piutang: {showBalance ? formatCurrency(debtSummary?.totalReceivable ?? 0) : 'Rp ••••••'} | Hutang: {showBalance ? formatCurrency(debtSummary?.totalPayable ?? 0) : 'Rp ••••••'}
          </p>
        </Link>

        {/* Investment Widget */}
        <Link href="/investments" className="p-6 bg-card/65 backdrop-blur-md border border-border/80 rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] hover:scale-[1.01] hover:border-primary/20 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-violet-600">
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
              <span className="font-body-sm font-semibold">Investasi</span>
            </div>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              (portfolioSummary?.totalGainLoss ?? 0) >= 0
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-red-500/10 text-red-600"
            )}>
              {(portfolioSummary?.totalGainLossPercent ?? 0) >= 0 ? '+' : ''}{portfolioSummary?.totalGainLossPercent ?? 0}%
            </span>
          </div>
          <div className="text-xl font-heading font-bold text-foreground truncate">
            {showBalance ? formatCurrency(portfolioSummary?.totalCurrentValue ?? 0) : 'Rp ••••••'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Modal: {showBalance ? formatCurrency(portfolioSummary?.totalInvested ?? 0) : 'Rp ••••••'} | Gain: {showBalance ? formatCurrency(portfolioSummary?.totalGainLoss ?? 0) : 'Rp ••••••'}
          </p>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 p-6 bg-card/65 backdrop-blur-md border border-border/80 rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] hover:border-emerald-500/10 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h3 className="font-h3 text-xl font-bold text-foreground">
              {chartView === 'overview' ? 'Cashflow Overview' : 'Prediksi Arus Kas (30 Hari Ke Depan)'}
            </h3>
            <div className="flex bg-muted/65 p-1 rounded-xl border border-border/40 text-xs font-semibold">
              <button
                onClick={() => setChartView('overview')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  chartView === 'overview'
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tren Harian
              </button>
              <button
                onClick={() => setChartView('forecast')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  chartView === 'forecast'
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="material-symbols-outlined text-[14px]">insights</span>
                Prediksi
              </button>
            </div>
          </div>

          <div className="relative">
            {!showBalance && (
              <div className="absolute inset-0 bg-background/20 backdrop-blur-[10px] z-20 flex flex-col items-center justify-center rounded-[20px] transition-all">
                <span className="material-symbols-outlined text-muted-foreground text-[32px] mb-2 select-none">visibility_off</span>
                <p className="text-sm text-muted-foreground font-semibold">Tampilkan saldo untuk melihat tren</p>
              </div>
            )}
            {chartView === 'overview' ? (
              chartData.length === 0 ? (
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
              )
            ) : (
              forecastChartData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                  No forecast data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={forecastChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                    <Area type="monotone" dataKey="Saldo" stroke="#3b82f6" fill="url(#colorBalance)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </div>

        {/* Expenses Pie */}
        <div className="p-6 bg-card/65 backdrop-blur-md border border-border/80 rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] hover:border-emerald-500/10 transition-all duration-300 relative overflow-hidden">
          <h3 className="font-h3 text-xl font-bold text-foreground mb-6">Top Expenses</h3>
          <div className="relative">
            {!showBalance && (
              <div className="absolute inset-0 bg-background/20 backdrop-blur-[10px] z-20 flex flex-col items-center justify-center rounded-[20px] transition-all">
                <span className="material-symbols-outlined text-muted-foreground text-[32px] mb-2 select-none">visibility_off</span>
                <p className="text-sm text-muted-foreground font-semibold text-center px-4">Tampilkan saldo untuk melihat rincian</p>
              </div>
            )}
            {pieData.length === 0 ? (
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
                      <span className="font-bold text-foreground">{showBalance ? formatCurrency(item.value) : 'Rp ••••••'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="w-full bg-card/65 backdrop-blur-md border border-border/80 rounded-[24px] shadow-[0px_2px_12px_rgba(26,43,60,0.03)] overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
          <h3 className="font-h3 text-xl font-bold text-foreground">Recent Activity</h3>
          <Link href="/transactions" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            See All <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>

        <div className="p-2">
          {!recentTx || recentTx.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <span className="material-symbols-outlined text-[32px]">receipt_long</span>
              </div>
              <p className="text-foreground font-semibold">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-1">Your recent activity will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {recentTx.map((tx, idx) => (
                <Link
                  key={tx.id}
                  href={`/transactions/${tx.id}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-[16px] transition-all duration-300 group gap-4 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm border border-border/50 group-hover:scale-105 transition-transform shrink-0"
                      style={{
                        backgroundColor: tx.category?.color ? `${tx.category.color}15` : 'var(--muted)',
                      }}
                    >
                      {tx.category?.icon || '📦'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground text-sm md:text-base truncate">
                        {tx.description || tx.category?.name || 'Transaction'}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5 font-medium truncate">
                        {tx.category?.name} • {formatTransactionDate(tx.date)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block shrink-0',
                        tx.type === 'INCOME'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 dark:bg-red-500/20'
                      )}
                    >
                      {tx.type === 'INCOME' ? 'Masuk' : 'Keluar'}
                    </span>
                    <div className="flex flex-col items-end text-right">
                      <span
                        className={cn(
                          'font-bold text-sm md:text-base',
                          tx.type === 'INCOME' ? 'text-emerald-600' : 'text-foreground'
                        )}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}{showBalance ? formatCurrency(Number(tx.amount)) : 'Rp ••••••'}
                      </span>
                    </div>
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
