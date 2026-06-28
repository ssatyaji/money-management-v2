'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/utils/currency';
import {
  useSavingGoalDetail,
  useAddContribution,
  useCompleteSavingGoal,
} from '@/hooks/use-saving-goals';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-transactions';

const GOAL_TYPE_LABELS: Record<string, string> = {
  SAVE_UP: 'Kumpulkan',
  PAY_OFF: 'Lunasi',
};

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: goal, isLoading } = useSavingGoalDetail(id);
  const contributeMutation = useAddContribution();
  const completeMutation = useCompleteSavingGoal();

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories('EXPENSE');

  const [showContribute, setShowContribute] = useState(false);
  const [form, setForm] = useState({ amount: '', accountId: '', note: '' });

  // Completion states
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completeAction, setCompleteAction] = useState<'WITHDRAW' | 'SPEND'>('WITHDRAW');
  const [completeTargetId, setCompleteTargetId] = useState('');

  // Auto pre-fill account selection
  useEffect(() => {
    if (accounts.length > 0 && !form.accountId) {
      setForm((prev) => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, form.accountId]);

  useEffect(() => {
    if (completeAction === 'WITHDRAW' && accounts.length > 0) {
      setCompleteTargetId(accounts[0].id);
    } else if (completeAction === 'SPEND' && categories.length > 0) {
      setCompleteTargetId(categories[0].id);
    } else {
      setCompleteTargetId('');
    }
  }, [completeAction, accounts, categories]);

  const handleContribute = async () => {
    if (!form.amount || !form.accountId) {
      toast.error('Isi jumlah kontribusi dan pilih dompet');
      return;
    }
    try {
      await contributeMutation.mutateAsync({
        goalId: id,
        data: {
          amount: Number(form.amount),
          accountId: form.accountId,
          note: form.note || undefined,
        },
      });
      toast.success('Kontribusi berhasil! 💰');
      setShowContribute(false);
      setForm({ amount: '', accountId: accounts[0]?.id || '', note: '' });
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Gagal menambahkan kontribusi';
      toast.error(errMsg);
    }
  };

  const handleCompleteGoal = async () => {
    if (!completeTargetId) {
      toast.error(completeAction === 'WITHDRAW' ? 'Pilih dompet tujuan' : 'Pilih kategori pengeluaran');
      return;
    }
    try {
      await completeMutation.mutateAsync({
        goalId: id,
        data: {
          action: completeAction,
          targetId: completeTargetId,
        },
      });
      toast.success(
        completeAction === 'WITHDRAW'
          ? 'Dana tabungan berhasil dicairkan ke dompet! 💳'
          : 'Tabungan berhasil dibelanjakan langsung! 🛍️',
      );
      setShowCompleteDialog(false);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Gagal menyelesaikan goal';
      toast.error(errMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-40" />
        <Skeleton className="w-full h-60" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Goal tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/goals')}>
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push('/goals')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Goals
      </button>

      {/* Completion/Celebration Callout */}
      {goal.status === 'COMPLETED' && goal.currentAmount > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
              <span>🎉</span> Goal Tercapai!
            </h3>
            <p className="text-sm text-emerald-800">
              Uang terkumpul senilai <strong>{formatCurrency(goal.currentAmount)}</strong>. Silakan pilih untuk mencairkan dana ini ke dompet Anda atau membelanjakannya langsung.
            </p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-sm shrink-0"
            onClick={() => setShowCompleteDialog(true)}
          >
            Klaim / Cairkan Tabungan
          </Button>
        </div>
      )}

      {/* Goal Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: `${goal.color}20` }}>
              {goal.icon || '🎯'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{goal.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {GOAL_TYPE_LABELS[goal.goalType]}
                {goal.description && ` • ${goal.description}`}
              </p>
            </div>
          </div>
          {goal.status === 'ACTIVE' && (
            <Button
              className="rounded-full gap-2"
              onClick={() => {
                setForm({ amount: '', accountId: accounts[0]?.id || '', note: '' });
                setShowContribute(true);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Kontribusi
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
            <span className="text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
          </div>
          <Progress
            value={goal.progress}
            className={cn(
              'h-4',
              goal.status === 'COMPLETED'
                ? '[&>div]:bg-emerald-500'
                : '[&>div]:bg-primary',
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{goal.progress}% tercapai</span>
            <span>Sisa: {formatCurrency(goal.remainingAmount)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={cn(
              'text-sm font-semibold mt-1',
              goal.status === 'COMPLETED' ? 'text-emerald-500' : goal.status === 'ACTIVE' ? 'text-blue-500' : 'text-gray-500',
            )}>
              {goal.status === 'COMPLETED' ? '✅ Selesai' : goal.status === 'ACTIVE' ? '🔵 Aktif' : '⚪ Dibatalkan'}
            </p>
          </div>
          {goal.suggestedMonthly !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Target/bulan</p>
              <p className="text-sm font-semibold mt-1">{formatCurrency(goal.suggestedMonthly)}</p>
            </div>
          )}
          {goal.daysRemaining !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Sisa waktu</p>
              <p className="text-sm font-semibold mt-1">{goal.daysRemaining} hari</p>
            </div>
          )}
          {goal.deadline && (
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="text-sm font-semibold mt-1">
                {new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contribution History */}
      <div className="rounded-2xl border border-border bg-card shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
        <div className="p-6 pb-4 border-b border-border/50">
          <h3 className="text-lg font-bold">Riwayat Kontribusi</h3>
        </div>
        <div className="p-2">
          {!goal.contributions || goal.contributions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl text-muted-foreground">history</span>
              </div>
              <p className="text-muted-foreground text-sm">Belum ada kontribusi</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {goal.contributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-500 text-[18px]">add_circle</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.note || 'Kontribusi'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+{formatCurrency(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contribute Dialog */}
      <Dialog open={showContribute} onOpenChange={setShowContribute}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kontribusi ke &quot;{goal.name}&quot;</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Sumber Dompet / Wallet</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              >
                <option value="" disabled>Pilih dompet...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input
                  type="text"
                  placeholder="5000000"
                  className="pl-10"
                  value={form.amount ? formatNumber(Number(form.amount)) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setForm({ ...form, amount: raw });
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Input
                placeholder="Bonus bulan ini"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <Button className="w-full" disabled={contributeMutation.isPending} onClick={handleContribute}>
              {contributeMutation.isPending ? 'Menyimpan...' : 'Tambah Kontribusi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Claim / Completion Actions Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cairkan Dana Tabungan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Pilih Tindakan</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteAction('WITHDRAW')}
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all gap-1',
                    completeAction === 'WITHDRAW'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700'
                      : 'border-border text-muted-foreground hover:border-emerald-500/50',
                  )}
                >
                  <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                  <span>Kembali ke Dompet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompleteAction('SPEND')}
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all gap-1',
                    completeAction === 'SPEND'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700'
                      : 'border-border text-muted-foreground hover:border-emerald-500/50',
                  )}
                >
                  <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
                  <span>Belanja Langsung</span>
                </button>
              </div>
            </div>

            {completeAction === 'WITHDRAW' ? (
              <div className="space-y-2">
                <Label>Pilih Dompet Penerima</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={completeTargetId}
                  onChange={(e) => setCompleteTargetId(e.target.value)}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Dana akan dikirimkan kembali ke dompet ini melalui transaksi bertipe TRANSFER.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Pilih Kategori Pengeluaran</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={completeTargetId}
                  onChange={(e) => setCompleteTargetId(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Dana akan langsung dibelanjakan ke kategori ini melalui transaksi bertipe EXPENSE.
                </p>
              </div>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg mt-2"
              disabled={completeMutation.isPending}
              onClick={handleCompleteGoal}
            >
              {completeMutation.isPending ? 'Memproses...' : 'Konfirmasi Pencairan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
