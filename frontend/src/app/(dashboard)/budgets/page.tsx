'use client';

import { useState } from 'react';
import {
  Plus,
  PiggyBank,
  AlertTriangle,
  TrendingDown,
  Trash2,
} from 'lucide-react';
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
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { useBudgetSummary, useCreateBudget, useDeleteBudget } from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-transactions';

export default function BudgetsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: summary, isLoading } = useBudgetSummary();
  const { data: categories = [] } = useCategories('EXPENSE');
  const createMutation = useCreateBudget();
  const deleteMutation = useDeleteBudget();

  const [form, setForm] = useState({
    amount: '',
    categoryId: '',
    alertAt: '80',
  });

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

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

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Budget dihapus');
    } catch {
      toast.error('Gagal menghapus budget');
    }
  };

  const budgets = summary?.budgets || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget</h1>
          <p className="text-muted-foreground mt-1">Atur anggaran pengeluaran per kategori</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
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
                    type="number"
                    placeholder="500000"
                    className="pl-10"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
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

      {/* Summary Cards */}
      {!isLoading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <PiggyBank className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">Total Budget</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground">Total Terpakai</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalSpent)}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">Peringatan</span>
            </div>
            <p className="text-2xl font-bold">
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
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="font-medium">Belum ada budget</p>
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
                'rounded-xl border bg-card p-5 transition-all',
                budget.isOverBudget
                  ? 'border-red-500/50'
                  : budget.isNearLimit
                    ? 'border-amber-500/50'
                    : 'border-border',
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{budget.category?.icon || '📦'}</span>
                  <div>
                    <p className="font-medium">{budget.category?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      budget.isOverBudget
                        ? 'text-red-500'
                        : budget.isNearLimit
                          ? 'text-amber-500'
                          : 'text-emerald-500',
                    )}
                  >
                    {budget.percentage}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
