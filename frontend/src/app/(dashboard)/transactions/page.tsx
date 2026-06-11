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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatTransactionDate } from '@/lib/utils/date';
import { useTransactions } from '@/hooks/use-transactions';
import { transactionsApi, type TransactionFilters } from '@/lib/api/transactions.api';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 15,
  });
  const [searchInput, setSearchInput] = useState('');
  const [activeType, setActiveType] = useState<string | undefined>();

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
          <h1 className="text-2xl font-bold">Transaksi</h1>
          <p className="text-muted-foreground mt-1">Kelola pemasukan dan pengeluaran Anda</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Unduh Laporan</span>
          </Button>
          <Link href="/transactions/new">
            <Button className="gap-2">
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
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeType === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeFilter(undefined)}
            className="text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            Semua
          </Button>
          <Button
            variant={activeType === 'INCOME' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeFilter('INCOME')}
            className={cn('text-xs', activeType === 'INCOME' && 'bg-emerald-600 hover:bg-emerald-700')}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Pemasukan
          </Button>
          <Button
            variant={activeType === 'EXPENSE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeFilter('EXPENSE')}
            className={cn('text-xs', activeType === 'EXPENSE' && 'bg-red-600 hover:bg-red-700')}
          >
            <TrendingDown className="w-3 h-3 mr-1" />
            Pengeluaran
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Filter className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Belum ada transaksi</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mulai catat transaksi pertama Anda
            </p>
            <Link href="/transactions/new" className="mt-4">
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Tambah Transaksi
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx) => (
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
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTransactionDate(tx.date)}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                        {tx.type === 'TRANSFER' ? 'Transfer' : tx.category?.name}
                      </Badge>
                      {tx.type === 'TRANSFER' ? (
                        <div className="flex items-center gap-1.5">
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
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
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
      </div>

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
