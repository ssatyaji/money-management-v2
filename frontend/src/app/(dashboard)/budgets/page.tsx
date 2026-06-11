'use client';

import { useState } from 'react';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/utils/currency';
import { useBudgetSummary, useCreateBudget, useDeleteBudget } from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-transactions';

export default function BudgetsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  // Timezone-safe local dates
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: summary, isLoading } = useBudgetSummary(startDate);
  const { data: categories = [] } = useCategories('EXPENSE');
  const createMutation = useCreateBudget();
  const deleteMutation = useDeleteBudget();

  const [form, setForm] = useState({
    amount: '',
    categoryId: '',
    alertAt: '80',
  });

  const handleMonthChange = (direction: number) => {
    setSelectedDate((prev) => {
      const nextDate = new Date(prev);
      nextDate.setMonth(nextDate.getMonth() + direction);
      return nextDate;
    });
  };

  const handleCreate = async () => {
    if (!form.amount || !form.categoryId) {
      toast.error('Isi jumlah dan pilih kategori');
      return;
    }
    try {
      await createMutation.mutateAsync({
        amount: Number(form.amount),
        period: 'MONTHLY',
        startDate,
        endDate,
        categoryId: form.categoryId,
        alertAt: Number(form.alertAt) || 80,
      });
      toast.success('Budget berhasil dibuat! 🎯');
      setShowCreate(false);
      setForm({ amount: '', categoryId: '', alertAt: '80' });
    } catch {
      toast.error('Gagal membuat budget');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirmId);
      toast.success('Budget berhasil dihapus 🗑️');
    } catch {
      toast.error('Gagal menghapus budget');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const budgets = summary?.budgets || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Budget</h1>
          <p className="text-muted-foreground mt-1">Atur anggaran pengeluaran per kategori</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Month Navigation */}
          <div className="flex items-center bg-card border border-border rounded-full p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handleMonthChange(-1)}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </Button>
            <span className="text-xs sm:text-sm font-semibold px-2 sm:px-4 min-w-[100px] sm:min-w-[120px] text-center capitalize">
              {selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handleMonthChange(1)}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Button>
          </div>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full px-5">
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span className="hidden sm:inline">Tambah Budget</span>
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Budget Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm({ ...form, categoryId: cat.id })}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all',
                        form.categoryId === cat.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50',
                      )}
                    >
                      <span className="text-base">{cat.icon || '📦'}</span>
                      <span className="truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget-amount">Jumlah Budget (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                  <Input
                    id="budget-amount"
                    type="text"
                    placeholder="500000"
                    className="pl-10"
                    value={form.amount ? formatNumber(Number(form.amount)) : ''}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      setForm({ ...form, amount: rawValue });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-at">Peringatan saat mencapai (%)</Label>
                <Input
                  id="alert-at"
                  type="number"
                  min={1}
                  max={100}
                  value={form.alertAt}
                  onChange={(e) => setForm({ ...form, alertAt: e.target.value })}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Periode: {new Date(startDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>

              <Button
                className="w-full"
                disabled={createMutation.isPending}
                onClick={handleCreate}
              >
                {createMutation.isPending ? 'Menyimpan...' : 'Buat Budget'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500 text-xl">savings</span>
              </div>
              <span className="text-body-sm font-medium text-muted-foreground">Total Budget</span>
            </div>
            <p className="text-numeric-lg tracking-tight">{formatCurrency(summary.totalBudget)}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-xl">trending_down</span>
              </div>
              <span className="text-body-sm font-medium text-muted-foreground">Total Terpakai</span>
            </div>
            <p className="text-numeric-lg tracking-tight">{formatCurrency(summary.totalSpent)}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-xl">warning</span>
              </div>
              <span className="text-body-sm font-medium text-muted-foreground">Peringatan</span>
            </div>
            <p className="text-numeric-lg tracking-tight">
              {summary.overBudgetCount > 0 && (
                <span className="text-red-500">{summary.overBudgetCount} Over</span>
              )}
              {summary.overBudgetCount > 0 && summary.nearLimitCount > 0 && ' · '}
              {summary.nearLimitCount > 0 && (
                <span className="text-amber-500">{summary.nearLimitCount} Hampir</span>
              )}
              {summary.overBudgetCount === 0 && summary.nearLimitCount === 0 && (
                <span className="text-emerald-500">Aman ✓</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Budget List */}
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
      ) : budgets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">track_changes</span>
          </div>
          <p className="font-semibold text-lg">Belum ada budget</p>
          <p className="text-sm text-muted-foreground mt-1">
            Buat budget pertama untuk mengontrol pengeluaran Anda
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className={cn(
                'rounded-2xl border bg-card p-5 transition-all shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover',
                budget.isOverBudget
                  ? 'border-red-500/50 bg-red-500/5'
                  : budget.isNearLimit
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-border',
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-2xl">
                    {budget.category?.icon || '📦'}
                  </div>
                  <div>
                    <p className="font-semibold">{budget.category?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'text-sm font-bold bg-background px-2.5 py-1 rounded-full border',
                      budget.isOverBudget
                        ? 'text-red-500 border-red-500/20'
                        : budget.isNearLimit
                          ? 'text-amber-500 border-amber-500/20'
                          : 'text-emerald-500 border-emerald-500/20',
                    )}
                  >
                    {budget.percentage}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </Button>
                </div>
              </div>

              <Progress
                value={Math.min(budget.percentage, 100)}
                className={cn(
                  'h-2.5',
                  budget.isOverBudget
                    ? '[&>div]:bg-red-500'
                    : budget.isNearLimit
                      ? '[&>div]:bg-amber-500'
                      : '[&>div]:bg-emerald-500',
                )}
              />

              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Sisa: {formatCurrency(Math.max(budget.remaining, 0))}</span>
                {budget.isOverBudget && (
                  <span className="text-red-500 font-medium">
                    Melebihi {formatCurrency(Math.abs(budget.remaining))}!
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus anggaran ini?
            </DialogDescription>
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
