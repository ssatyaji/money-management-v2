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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatTransactionDate } from '@/lib/utils/date';
import { useTransactions } from '@/hooks/use-transactions';
import type { TransactionFilters } from '@/lib/api/transactions.api';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 15,
  });
  const [searchInput, setSearchInput] = useState('');
  const [activeType, setActiveType] = useState<string | undefined>();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaksi</h1>
          <p className="text-muted-foreground mt-1">Kelola pemasukan dan pengeluaran Anda</p>
        </div>
        <Link href="/transactions/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Transaksi</span>
          </Button>
        </Link>
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
                className="flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 transition-colors"
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formatTransactionDate(tx.date)}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {tx.category?.name}
                      </Badge>
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    'text-sm font-semibold whitespace-nowrap',
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
    </div>
  );
}
