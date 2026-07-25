'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import {
  useInvestmentAssets,
  usePortfolioSummary,
  useDeleteInvestmentAsset,
} from '@/hooks/use-investments';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const ASSET_TYPE_LABELS: Record<string, string> = {
  STOCK: 'Saham',
  GOLD: 'Emas',
  CRYPTO: 'Crypto',
  MUTUAL_FUND: 'Reksa Dana',
  BOND: 'Obligasi',
  DEPOSIT: 'Deposito',
  PROPERTY: 'Properti',
  OTHER: 'Lainnya',
};

const ALLOCATION_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6',
];

export default function InvestmentsPage() {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { data: assets = [], isLoading } = useInvestmentAssets();
  const { data: portfolio } = usePortfolioSummary();
  const deleteMutation = useDeleteInvestmentAsset();

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirmId);
      toast.success('Aset berhasil dihapus 🗑️');
    } catch {
      toast.error('Gagal menghapus aset');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const pieData = portfolio?.allocation?.map((item, idx) => ({
    name: ASSET_TYPE_LABELS[item.type] || item.type,
    value: item.value,
    color: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Investasi</h1>
          <p className="text-muted-foreground mt-1">Lacak aset investasi Anda</p>
        </div>
        <Link href="/investments/add">
          <Button className="gap-2 rounded-full px-5">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="hidden sm:inline">Tambah Aset</span>
          </Button>
        </Link>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-violet-500 text-xl">account_balance</span>
                </div>
                <span className="text-body-sm font-medium text-muted-foreground">Nilai Saat Ini</span>
              </div>
              <p className="text-numeric-lg tracking-tight">{formatCurrency(portfolio.totalCurrentValue)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500 text-xl">payments</span>
                </div>
                <span className="text-body-sm font-medium text-muted-foreground">Total Investasi</span>
              </div>
              <p className="text-numeric-lg tracking-tight">{formatCurrency(portfolio.totalInvested)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover sm:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  portfolio.totalGainLoss >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
                )}>
                  <span className={cn(
                    'material-symbols-outlined text-xl',
                    portfolio.totalGainLoss >= 0 ? 'text-emerald-500' : 'text-red-500',
                  )}>
                    {portfolio.totalGainLoss >= 0 ? 'trending_up' : 'trending_down'}
                  </span>
                </div>
                <span className="text-body-sm font-medium text-muted-foreground">Gain/Loss</span>
              </div>
              <div className="flex items-baseline gap-3">
                <p className={cn(
                  'text-numeric-lg tracking-tight',
                  portfolio.totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600',
                )}>
                  {portfolio.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(portfolio.totalGainLoss)}
                </p>
                <span className={cn(
                  'text-sm font-bold px-2 py-0.5 rounded-full',
                  portfolio.totalGainLossPercent >= 0
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-red-500/10 text-red-600',
                )}>
                  {portfolio.totalGainLossPercent >= 0 ? '+' : ''}{portfolio.totalGainLossPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Pie */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
            <h3 className="font-bold mb-4">Alokasi Portfolio</h3>
            {pieData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Belum ada data
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
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
                        color: 'var(--foreground)',
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-foreground font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-foreground">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Asset List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="w-40 h-5 mb-3" />
              <Skeleton className="w-full h-3 mb-2" />
              <Skeleton className="w-32 h-4" />
            </div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">trending_up</span>
          </div>
          <p className="font-semibold text-lg">Belum ada aset</p>
          <p className="text-sm text-muted-foreground mt-1">Tambahkan aset investasi pertama Anda!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-2xl border border-border bg-card p-5 transition-all shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link href={`/investments/${asset.id}`} className="flex items-center gap-4 min-w-0 group">
                  <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-2xl shrink-0">
                    {asset.icon || '📈'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold group-hover:text-primary transition-colors truncate text-base sm:text-lg">{asset.name}</p>
                      {asset.ticker && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-mono">
                          {asset.ticker}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {ASSET_TYPE_LABELS[asset.assetType]} • {asset.totalUnits} unit @ {formatCurrency(asset.currentPrice)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border/40 sm:border-0 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-bold">{formatCurrency(asset.currentValue)}</p>
                    <p className={cn(
                      'text-xs font-bold',
                      asset.gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600',
                    )}>
                      {asset.gainLoss >= 0 ? '+' : ''}{formatCurrency(asset.gainLoss)} ({asset.gainLossPercent >= 0 ? '+' : ''}{asset.gainLossPercent}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/investments/${asset.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 rounded-full cursor-pointer"
                        title="Edit Aset"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full cursor-pointer"
                      title="Hapus Aset"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteConfirmId(asset.id);
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus aset ini? Semua transaksi terkait akan ikut terhapus.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
