'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Clock,
  CalendarDays,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatTransactionDate, formatGroupHeaderDate } from '@/lib/utils/date';
import { useTransactions } from '@/hooks/use-transactions';
import { transactionsApi, type TransactionFilters } from '@/lib/api/transactions.api';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, format } from 'date-fns';


const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 15,
  });
  const [searchInput, setSearchInput] = useState('');
  const [activeType, setActiveType] = useState<string | undefined>();

  // Date filter states
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [dateMode, setDateMode] = useState<'month' | 'preset' | 'custom'>('preset');
  const [datePreset, setDatePreset] = useState<string>('all');
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Export states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [exportPeriod, setExportPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useTransactions(filters);
  const transactions = data?.data || [];
  const meta = data?.meta;

  // Group transactions by date (yyyy-MM-dd)
  const groupedTransactions = transactions.reduce((groups: { [key: string]: typeof transactions }, tx) => {
    const dateKey = tx.date.split('T')[0]; // Get date part only
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
    return groups;
  }, {});

  // Sorted date keys in descending order
  const dateKeys = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  };

  const handleTypeFilter = (type: string | undefined) => {
    setActiveType(type);
    setFilters((prev) => ({ ...prev, type, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleMonthSelect = (monthIdx: number, year: number) => {
    setSelectedMonth(monthIdx);
    setSelectedYear(year);
    setDateMode('month');

    const start = startOfMonth(new Date(year, monthIdx - 1, 1));
    const end = endOfMonth(new Date(year, monthIdx - 1, 1));

    setCustomRange({ from: undefined, to: undefined });
    setFilters((prev) => ({
      ...prev,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      page: 1,
    }));
    setShowPeriodDropdown(false);
  };

  const handlePresetSelect = (presetId: string) => {
    setDateMode('preset');
    setDatePreset(presetId);
    let startDate: string | undefined = undefined;
    let endDate: string | undefined = undefined;

    const currentDate = new Date();

    if (presetId === 'this-month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      startDate = format(start, 'yyyy-MM-dd');
      endDate = format(end, 'yyyy-MM-dd');
      setSelectedMonth(currentDate.getMonth() + 1);
      setSelectedYear(currentDate.getFullYear());
    } else if (presetId === 'last-month') {
      const lastMonth = subMonths(currentDate, 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      startDate = format(start, 'yyyy-MM-dd');
      endDate = format(end, 'yyyy-MM-dd');
      setSelectedMonth(lastMonth.getMonth() + 1);
      setSelectedYear(lastMonth.getFullYear());
    } else if (presetId === 'last-3-months') {
      const start = startOfMonth(subMonths(currentDate, 2));
      startDate = format(start, 'yyyy-MM-dd');
      endDate = format(currentDate, 'yyyy-MM-dd');
    } else if (presetId === 'this-year') {
      const start = startOfYear(currentDate);
      const end = endOfYear(currentDate);
      startDate = format(start, 'yyyy-MM-dd');
      endDate = format(end, 'yyyy-MM-dd');
      setSelectedYear(currentDate.getFullYear());
    } else if (presetId === 'all') {
      startDate = undefined;
      endDate = undefined;
    }

    setCustomRange({ from: undefined, to: undefined });
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
      page: 1,
    }));
    setShowPeriodDropdown(false);
  };

  const handleCustomRangeSelect = (range: any) => {
    setCustomRange(range || { from: undefined, to: undefined });
    setDateMode('custom');

    if (range?.from) {
      const startDate = format(range.from, 'yyyy-MM-dd');
      const endDate = range.to ? format(range.to, 'yyyy-MM-dd') : startDate;
      setFilters((prev) => ({
        ...prev,
        startDate,
        endDate,
        page: 1,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
        page: 1,
      }));
    }
  };

  const getDateFilterLabel = () => {
    if (dateMode === 'month') {
      return `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
    }
    if (dateMode === 'preset') {
      if (datePreset === 'all') return 'Semua Waktu';
      if (datePreset === 'this-month') return `Bulan Ini (${MONTH_NAMES[selectedMonth - 1]})`;
      if (datePreset === 'last-month') return 'Bulan Lalu';
      if (datePreset === 'last-3-months') return '3 Bulan Terakhir';
      if (datePreset === 'this-year') return `Tahun ${selectedYear}`;
    }
    if (dateMode === 'custom') {
      if (customRange?.from) {
        if (customRange.to) {
          return `${format(customRange.from, 'd MMM')} - ${format(customRange.to, 'd MMM yyyy')}`;
        }
        return format(customRange.from, 'd MMM yyyy');
      }
      return 'Rentang Kustom';
    }
    return 'Pilih Periode';
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await transactionsApi.export(exportFormat, exportPeriod, exportMonth, exportYear);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan-Transaksi-${exportPeriod}-${exportYear}${exportPeriod === 'monthly' ? `-${exportMonth}` : ''}.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Laporan berhasil diunduh');
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengunduh laporan');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Transaksi</h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Kelola pemasukan dan pengeluaran Anda</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/transactions/recurring">
            <Button variant="outline" className="gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 cursor-pointer">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Tagihan Berulang</span>
            </Button>
          </Link>
          <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Unduh Laporan</span>
          </Button>
          <Link href="/transactions/new">
            <Button className="gap-2 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Transaksi</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi..."
            className="pl-9 h-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 w-full sm:w-auto shrink-0">
          {/* Date Filter Popover */}
          <Popover open={showPeriodDropdown} onOpenChange={setShowPeriodDropdown}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-9 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <CalendarDays className="w-4 h-4" />
                <span>{getDateFilterLabel()}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>
            </PopoverTrigger>

            <PopoverContent className="w-80 p-4 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800/80 shadow-2xl z-50 space-y-3" align="start">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Pilih Periode
                </span>
                <button
                  type="button"
                  onClick={() => setShowPeriodDropdown(false)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Tutup
                </button>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setDateMode('month')}
                  className={cn(
                    "py-1 rounded-lg transition-all text-center cursor-pointer",
                    dateMode === 'month'
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  Bulan
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('preset')}
                  className={cn(
                    "py-1 rounded-lg transition-all text-center cursor-pointer",
                    dateMode === 'preset'
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  Cepat
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('custom')}
                  className={cn(
                    "py-1 rounded-lg transition-all text-center cursor-pointer",
                    dateMode === 'custom'
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  Kustom
                </button>
              </div>

              {/* Tab 1: Bulan & Tahun (Dashboard Style) */}
              {dateMode === 'month' && (
                <div className="space-y-3 animate-in fade-in-50 duration-150">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Tahun</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none cursor-pointer"
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Bulan</label>
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {MONTH_NAMES.map((name, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleMonthSelect(idx + 1, selectedYear)}
                          className={cn(
                            'px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-all text-center cursor-pointer',
                            selectedMonth === idx + 1 && dateMode === 'month'
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

              {/* Tab 2: Quick Presets */}
              {dateMode === 'preset' && (
                <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                  {[
                    { id: 'all', label: 'Semua Waktu' },
                    { id: 'this-month', label: 'Bulan Ini' },
                    { id: 'last-month', label: 'Bulan Lalu' },
                    { id: 'last-3-months', label: '3 Bulan Terakhir' },
                    { id: 'this-year', label: 'Tahun Ini' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetSelect(p.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-between",
                        datePreset === p.id && dateMode === 'preset'
                          ? "bg-blue-600 text-white font-bold shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <span>{p.label}</span>
                      {datePreset === p.id && dateMode === 'preset' && (
                        <span className="text-[10px]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab 3: Custom Date Range (Calendar) */}
              {dateMode === 'custom' && (
                <div className="space-y-2 animate-in fade-in-50 duration-150 flex flex-col items-center">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50/50 dark:bg-slate-800/30">
                    <Calendar
                      mode="range"
                      selected={customRange}
                      onSelect={handleCustomRangeSelect}
                      numberOfMonths={1}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    * Klik tanggal awal &amp; tanggal akhir pada kalender.
                  </p>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Button
            variant={activeType === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeFilter(undefined)}
            className="text-xs h-9 cursor-pointer"
          >
            <Filter className="w-3 h-3 mr-1" />
            Semua
          </Button>
          <Button
            variant={activeType === 'INCOME' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeFilter('INCOME')}
            className={cn('text-xs h-9 cursor-pointer', activeType === 'INCOME' && 'bg-emerald-600 hover:bg-emerald-700')}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Pemasukan
          </Button>
          <Button
            variant={activeType === 'EXPENSE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeFilter('EXPENSE')}
            className={cn('text-xs h-9 cursor-pointer', activeType === 'EXPENSE' && 'bg-red-600 hover:bg-red-700')}
          >
            <TrendingDown className="w-3 h-3 mr-1" />
            Pengeluaran
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              <Skeleton className="w-24 h-5" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Filter className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Belum ada transaksi</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tidak ada transaksi yang cocok dengan filter aktif
            </p>
            <Link href="/transactions/new" className="mt-4">
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Tambah Transaksi
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((dateKey) => (
            <div key={dateKey} className="space-y-2">
              {/* Group Header */}
              <div className="flex items-center justify-between px-1 text-xs font-semibold text-muted-foreground select-none">
                <span>{formatGroupHeaderDate(dateKey)}</span>
                <span className="text-[10px] bg-muted dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                  {groupedTransactions[dateKey].length} Transaksi
                </span>
              </div>
              {/* Transactions in Group */}
              <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border shadow-[0px_2px_8px_rgba(26,43,60,0.02)]">
                {groupedTransactions[dateKey].map((tx) => {
                  const timeStr = format(new Date(tx.date), 'HH:mm');
                  return (
                    <Link
                      key={tx.id}
                      href={`/transactions/${tx.id}`}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                          style={{
                            backgroundColor: tx.category?.color
                              ? `${tx.category.color}15`
                              : undefined,
                          }}
                        >
                          {tx.category?.icon || '📦'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {tx.description || tx.category?.name || 'Transaksi'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              Pukul {timeStr}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                              {tx.type === 'TRANSFER' ? 'Transfer' : tx.category?.name}
                            </Badge>
                            {tx.type === 'TRANSFER' ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none whitespace-nowrap">
                                  {tx.account?.name || 'Saldo Utama'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">➔</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none whitespace-nowrap">
                                  {tx.destinationAccount?.name || 'Saldo Utama'}
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted/60 text-muted-foreground border-none whitespace-nowrap">
                                {tx.account?.name || 'Saldo Utama'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'text-sm font-semibold whitespace-nowrap shrink-0 text-right',
                          tx.type === 'INCOME' ? 'text-emerald-500' : (tx.type === 'EXPENSE' ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'),
                        )}
                      >
                        {tx.type === 'INCOME' ? '+' : (tx.type === 'EXPENSE' ? '-' : '')}
                        {formatCurrency(Number(tx.amount))}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card shadow-[0px_2px_8px_rgba(26,43,60,0.02)]">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            {meta.total} transaksi · Halaman {meta.page} dari {meta.totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={meta.page <= 1}
              onClick={() => handlePageChange(meta.page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={meta.page >= meta.totalPages}
              onClick={() => handlePageChange(meta.page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unduh Laporan Transaksi</DialogTitle>
            <DialogDescription>
              Pilih format dan periode laporan yang ingin Anda unduh.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Format File</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={exportFormat === 'excel' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('excel')}
                  className={cn(exportFormat === 'excel' && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                >
                  Excel (.xlsx)
                </Button>
                <Button
                  type="button"
                  variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('pdf')}
                  className={cn(exportFormat === 'pdf' && "bg-red-600 hover:bg-red-700 text-white")}
                >
                  PDF (.pdf)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Periode</Label>
              <Select value={exportPeriod} onValueChange={(v: 'monthly' | 'yearly') => setExportPeriod(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportPeriod === 'monthly' && (
              <div className="space-y-2">
                <Label>Bulan</Label>
                <Select value={exportMonth.toString()} onValueChange={(v) => setExportMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2000, i, 1).toLocaleString('id-ID', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select value={exportYear.toString()} onValueChange={(v) => setExportYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Batal</Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Mengunduh...' : 'Download Sekarang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
