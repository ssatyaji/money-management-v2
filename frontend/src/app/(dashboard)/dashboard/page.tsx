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
import { useSavingGoalSummary, useSavingGoals } from '@/hooks/use-saving-goals';
import { useDebtSummary } from '@/hooks/use-debts';
import { usePortfolioSummary } from '@/hooks/use-investments';
import { useMonthlyReport } from '@/hooks/use-budgets';
import { AlertCards } from '@/components/dashboard/alert-cards';
import { BoltzStatCards } from '@/components/dashboard/boltz-stat-cards';
import { BoltzWalletCards } from '@/components/dashboard/boltz-wallet-cards';
import {
  Calendar,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Target,
  HandCoins,
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Plus,
} from 'lucide-react';

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatShortCurrency = (val: number) => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
  return `${val}`;
};

export default function DashboardPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const [showBalance, setShowBalance] = useState(false);
  const [periodTab, setPeriodTab] = useState<'today' | 'weekly' | 'monthly'>('monthly');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryTab, setCategoryTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  useEffect(() => {
    setCurrentPage(1);
  }, [periodTab, selectedMonth, selectedYear]);

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

  // Calculate previous month for Month-over-Month (MoM) comparison
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  const { data: summary, isLoading: loadingSummary } = useTransactionSummary(selectedMonth, selectedYear);
  const { data: prevSummary } = useTransactionSummary(prevMonth, prevYear);
  const { data: breakdown, isLoading: loadingBreakdown } = useCategoryBreakdown(selectedMonth, selectedYear);
  const { data: dailyTrend, isLoading: loadingTrend } = useDailyTrend(selectedMonth, selectedYear);
  const { data: recentTx, isLoading: loadingRecent } = useRecentTransactions(50);
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: forecastData, isLoading: loadingForecast } = useCashflowForecast();
  const { data: savingSummary, isLoading: loadingSaving } = useSavingGoalSummary();
  const { data: savingGoals = [] } = useSavingGoals();
  const { data: debtSummary, isLoading: loadingDebts } = useDebtSummary();
  const { data: portfolioSummary, isLoading: loadingPortfolio } = usePortfolioSummary();
  const { data: monthlyReport } = useMonthlyReport(selectedMonth, selectedYear);

  const isLoading =
    loadingSummary ||
    loadingBreakdown ||
    loadingTrend ||
    loadingRecent ||
    loadingAccounts ||
    loadingForecast ||
    loadingSaving ||
    loadingDebts ||
    loadingPortfolio;

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  const rawCategories = (monthlyReport?.categoryBreakdown || breakdown || [])
    .filter((c: any) => (c.type ? c.type === categoryTab : categoryTab === 'EXPENSE'))
    .map((c: any) => ({
      name: c.name || c.category?.name || 'Lainnya',
      total: Number(c.total) || 0,
      icon: c.icon || c.category?.icon || (categoryTab === 'EXPENSE' ? '📦' : '💰'),
      color: c.color || c.category?.color,
      count: c.count || 0,
    }))
    .sort((a: any, b: any) => b.total - a.total);

  const totalCatAmount = rawCategories.reduce((sum: number, c: any) => sum + c.total, 0);

  const pieData = rawCategories.map((item: any, idx: number) => ({
    name: item.name,
    value: item.total,
    color: item.color || COLORS[idx % COLORS.length],
    icon: item.icon,
    count: item.count,
    percentage: totalCatAmount > 0 ? (item.total / totalCatAmount) * 100 : 0,
  }));

  const chartData = (dailyTrend || []).map((d) => ({
    date: d.date.slice(5),
    Pemasukan: d.income,
    Pengeluaran: d.expense,
  }));

  const totalCash = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  const totalSavings = Number(savingSummary?.totalSaved) || 0;
  const totalInvestments = Number(portfolioSummary?.totalCurrentValue) || 0;
  const totalReceivables = Number(debtSummary?.totalReceivable) || 0;
  const totalPayables = Number(debtSummary?.totalPayable) || 0;

  const netWorth = totalCash + totalSavings + totalInvestments + totalReceivables - totalPayables;

  // ─── Dynamic Month-over-Month (MoM) Calculations ──────────────────────────
  const curIncome = Number(summary?.totalIncome) || 0;
  const prevInc = Number(prevSummary?.totalIncome) || 0;
  const incomeTrendPct = prevInc > 0 ? ((curIncome - prevInc) / prevInc) * 100 : 0;

  const curExpense = Number(summary?.totalExpense) || 0;
  const prevExp = Number(prevSummary?.totalExpense) || 0;
  const expenseTrendPct = prevExp > 0 ? ((curExpense - prevExp) / prevExp) * 100 : 0;

  const savingsGainPercent = Number(portfolioSummary?.totalGainLossPercent) || Number(savingSummary?.overallProgress) || 0;

  // ─── Precise Filter for Recent Transactions ────────────────────────────────
  const displayedTransactions = (recentTx || []).filter((tx) => {
    const txDate = new Date(tx.date);
    const currentDate = new Date();

    if (periodTab === 'today') {
      return (
        txDate.getFullYear() === currentDate.getFullYear() &&
        txDate.getMonth() === currentDate.getMonth() &&
        txDate.getDate() === currentDate.getDate()
      );
    }
    if (periodTab === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(currentDate.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);
      return txDate >= oneWeekAgo;
    }
    if (periodTab === 'monthly') {
      return (
        txDate.getMonth() + 1 === selectedMonth &&
        txDate.getFullYear() === selectedYear
      );
    }
    return true;
  });

  const PAGE_SIZE = 10;
  const totalItems = displayedTransactions.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const paginatedTransactions = displayedTransactions.slice(startIndex, endIndex);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7 relative">
      {/* Mobile Floating Action Button (FAB) */}
      <Link
        href="/transactions/new"
        className="fixed bottom-24 right-5 z-40 lg:hidden w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-xl shadow-blue-600/40 flex items-center justify-center transition-all active:scale-95 border-2 border-white dark:border-slate-900"
        title="Tambah Transaksi Baru"
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* Alert Notifications */}
      <AlertCards />

      {/* Title & Filter Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ringkasan posisi keuangan pribadi, arus kas, tabungan & investasi Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative">
          <button
            onClick={toggleBalance}
            type="button"
            className="h-10 px-3.5 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showBalance ? 'Sembunyikan Saldo' : 'Tampilkan Saldo'}</span>
          </button>

          {/* Filter Periode Action Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="h-10 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showPeriodDropdown && (
              <div className="absolute right-0 top-12 w-64 p-4 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800/80 shadow-xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Pilih Periode
                  </span>
                  <button
                    onClick={() => setShowPeriodDropdown(false)}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold"
                  >
                    Tutup
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Tahun</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Bulan</label>
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pt-1">
                    {MONTH_NAMES.map((name, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedMonth(idx + 1);
                          setShowPeriodDropdown(false);
                        }}
                        className={cn(
                          'px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-all text-center',
                          selectedMonth === idx + 1
                            ? 'bg-blue-600 text-white shadow-sm font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                        )}
                      >
                        {name.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 1: 4 Top Stat Cards with Dynamic Real Calculation Trends */}
      <BoltzStatCards
        totalBalance={totalCash}
        income={curIncome}
        expense={curExpense}
        savings={totalSavings + totalInvestments}
        showBalance={showBalance}
        incomeTrend={{ value: incomeTrendPct, label: 'vs bln lalu' }}
        expenseTrend={{ value: expenseTrendPct, label: 'vs bln lalu' }}
        savingsTrend={{ value: savingsGainPercent, label: 'pertumbuhan' }}
        netWorth={netWorth}
        totalSavings={totalSavings}
        totalInvestments={totalInvestments}
        totalReceivables={totalReceivables}
        totalPayables={totalPayables}
        accountsCount={accounts.length}
      />

      {/* Row 2: Middle Charts (Detailed Category Statistics + Cashflow Area Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Category Arc Ring & Detailed Breakdown */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Statistik Kategori
              </h3>
              <p className="text-[11px] text-slate-400">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
            <Link
              href="/reports/monthly"
              className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline shrink-0"
            >
              <span>Laporan Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Type Tab Switcher: Pengeluaran vs Pemasukan */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCategoryTab('EXPENSE')}
              className={cn(
                'flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer',
                categoryTab === 'EXPENSE'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setCategoryTab('INCOME')}
              className={cn(
                'flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer',
                categoryTab === 'INCOME'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              Pemasukan
            </button>
          </div>

          {/* Donut Chart with Center Total Display */}
          <div className="h-52 relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), 'Nominal']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Total {categoryTab === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {showBalance ? formatCurrency(totalCatAmount) : 'Rp ••••••'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center">
                Belum ada transaksi {categoryTab === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'} pada periode ini
              </p>
            )}
          </div>

          {/* Detailed Category Progress Breakdown List */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {pieData.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">Data kategori kosong</p>
            ) : (
              pieData.map((item: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-extrabold shrink-0">
                      {showBalance ? formatCurrency(item.value) : 'Rp ••••••'}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.max(item.percentage, 2), 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{item.percentage.toFixed(1)}% dari total</span>
                    <span>{item.count > 0 ? `${item.count} transaksi` : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Card: Double Smooth Line Chart */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Ringkasan Arus Kas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Pemasukan vs Pengeluaran Harian</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Pengeluaran
              </span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[360px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={45} tickFormatter={formatShortCurrency} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Pemasukan"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="Pengeluaran"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: 4 Colorful Wallet Credit Cards Grid */}
      <BoltzWalletCards accounts={accounts} showBalance={showBalance} />

      {/* Row 4: Financial Summary Cards for Goals, Hutang/Piutang, & Investasi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Target Tabungan
                </h3>
                <p className="text-[11px] text-slate-400">Pencapaian Impian Anda</p>
              </div>
            </div>
            <Link href="/goals" className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline">
              <span>Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Terkumpul</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {showBalance ? formatCurrency(totalSavings) : 'Rp ••••••'} / {showBalance ? formatCurrency(Number(savingSummary?.totalTarget) || 0) : 'Rp ••••••'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Number(savingSummary?.overallProgress) || 0, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-right font-bold text-purple-600 dark:text-purple-400">
              {Number(savingSummary?.overallProgress || 0).toFixed(1)}% Terpenuhi
            </p>
          </div>

          {/* Goals Preview List */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {savingGoals.slice(0, 2).map((goal) => {
              const progressPct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              return (
                <div key={goal.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{goal.icon || '🎯'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{goal.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {progressPct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hutang & Piutang Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <HandCoins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Hutang & Piutang
                </h3>
                <p className="text-[11px] text-slate-400">Kewajiban & Tagihan</p>
              </div>
            </div>
            <Link href="/debts" className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline">
              <span>Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Piutang (Tagih)</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                {showBalance ? formatCurrency(totalReceivables) : 'Rp ••••••'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
              <p className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">Hutang (Bayar)</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                {showBalance ? formatCurrency(totalPayables) : 'Rp ••••••'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Posisi Bersih:</span>
            <span className={cn(
              'font-bold px-2 py-0.5 rounded-full text-[11px]',
              totalReceivables - totalPayables >= 0
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
            )}>
              {showBalance
                ? `${totalReceivables - totalPayables >= 0 ? '+' : ''}${formatCurrency(totalReceivables - totalPayables)}`
                : 'Rp ••••••'}
            </span>
          </div>
        </div>

        {/* Investasi Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Portofolio Investasi
                </h3>
                <p className="text-[11px] text-slate-400">Pertumbuhan Aset</p>
              </div>
            </div>
            <Link href="/investments" className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline">
              <span>Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Nilai Portofolio</p>
            <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {showBalance ? formatCurrency(totalInvestments) : 'Rp ••••••'}
            </h4>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Estimasi Return:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {showBalance ? formatCurrency(Number(portfolioSummary?.totalGainLoss) || 0) : 'Rp ••••••'} ({Number(portfolioSummary?.totalGainLossPercent || 0).toFixed(1)}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Row 5: Recent Transactions Table with Period Filter Tabs */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Transaksi Terkini
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Daftar mutasi keuangan terbaru Anda</p>
          </div>

          {/* Period Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold w-full sm:w-auto overflow-x-auto justify-between sm:justify-start">
            <button
              onClick={() => setPeriodTab('today')}
              className={cn(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer flex-1 sm:flex-none text-center',
                periodTab === 'today'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              )}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriodTab('weekly')}
              className={cn(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer flex-1 sm:flex-none text-center',
                periodTab === 'weekly'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              )}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setPeriodTab('monthly')}
              className={cn(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer flex-1 sm:flex-none text-center',
                periodTab === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              )}
            >
              Bulan Ini
            </button>
          </div>
        </div>

        {/* Mobile View: Spacious List Items */}
        <div className="space-y-3 md:hidden">
          {paginatedTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
              Belum ada transaksi pada periode {periodTab === 'today' ? 'Hari Ini' : periodTab === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}.
            </div>
          ) : (
            paginatedTransactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className={cn(
                      'w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0',
                      isIncome
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
                    )}>
                      {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {tx.description || tx.category?.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="truncate">{tx.category?.name || 'Umum'}</span>
                        <span>•</span>
                        <span className="shrink-0">{formatTransactionDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'font-bold text-xs',
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    )}>
                      {isIncome ? '+' : '-'}{showBalance ? formatCurrency(Number(tx.amount)) : 'Rp ••••••'}
                    </p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      Selesai
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Deskripsi & Kategori</th>
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Nominal</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-semibold">
                    Belum ada transaksi pada periode {periodTab === 'today' ? 'Hari Ini' : periodTab === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 flex items-center gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0',
                          isIncome
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
                        )}>
                          {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{tx.description || tx.category?.name}</p>
                          <p className="text-[10px] text-slate-400">{tx.category?.name || 'Umum'}</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">
                        {formatTransactionDate(tx.date)}
                      </td>
                      <td className={cn(
                        'py-3.5 font-bold',
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      )}>
                        {isIncome ? '+' : '-'}{showBalance ? formatCurrency(Number(tx.amount)) : 'Rp ••••••'}
                      </td>
                      <td className="py-3.5 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          Selesai
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{startIndex + 1}</span> - <span className="font-bold text-slate-800 dark:text-slate-200">{endIndex}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{totalItems}</span> transaksi
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              <span className="px-2 font-bold text-slate-800 dark:text-slate-200 text-xs">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
