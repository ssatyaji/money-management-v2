'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import {
  useSavingGoals,
  useSavingGoalSummary,
  useCreateSavingGoal,
  useDeleteSavingGoal,
  useAddContribution,
} from '@/hooks/use-saving-goals';
import { useAccounts } from '@/hooks/use-accounts';

const GOAL_TYPE_LABELS: Record<string, string> = {
  SAVE_UP: 'Kumpulkan',
  PAY_OFF: 'Lunasi',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Aktif', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  COMPLETED: { label: 'Selesai', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED: { label: 'Dibatalkan', color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' },
};

export default function GoalsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showContribute, setShowContribute] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: goals = [], isLoading } = useSavingGoals();
  const { data: summary } = useSavingGoalSummary();
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateSavingGoal();
  const deleteMutation = useDeleteSavingGoal();
  const contributeMutation = useAddContribution();

  const [form, setForm] = useState({
    name: '',
    goalType: 'SAVE_UP' as 'SAVE_UP' | 'PAY_OFF',
    targetAmount: '',
    description: '',
    icon: '🎯',
    deadline: '',
  });

  const [contributeForm, setContributeForm] = useState({
    amount: '',
    accountId: '',
    note: '',
  });

  const handleCreate = async () => {
    if (!form.name || !form.targetAmount) {
      toast.error('Isi nama dan target jumlah');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: form.name,
        goalType: form.goalType,
        targetAmount: Number(form.targetAmount),
        description: form.description || undefined,
        icon: form.icon || undefined,
        deadline: form.deadline || undefined,
      });
      toast.success('Goal berhasil dibuat! 🎯');
      setShowCreate(false);
      setForm({ name: '', goalType: 'SAVE_UP', targetAmount: '', description: '', icon: '🎯', deadline: '' });
    } catch {
      toast.error('Gagal membuat goal');
    }
  };

  const handleContribute = async () => {
    if (!showContribute || !contributeForm.amount || !contributeForm.accountId) {
      toast.error('Isi jumlah kontribusi dan pilih dompet');
      return;
    }
    try {
      await contributeMutation.mutateAsync({
        goalId: showContribute,
        data: {
          amount: Number(contributeForm.amount),
          accountId: contributeForm.accountId,
          note: contributeForm.note || undefined,
        },
      });
      toast.success('Kontribusi berhasil ditambahkan! 💰');
      setShowContribute(null);
      setContributeForm({ amount: '', accountId: '', note: '' });
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Gagal menambahkan kontribusi';
      toast.error(errMsg);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirmId);
      toast.success('Goal berhasil dihapus 🗑️');
    } catch {
      toast.error('Gagal menghapus goal');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Saving Goals</h1>
          <p className="text-muted-foreground mt-1">Target tabungan & pelunasan</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full px-5">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden sm:inline">Buat Goal</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Goal Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nama Goal</Label>
                <Input
                  placeholder="Contoh: DP Rumah"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipe</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['SAVE_UP', 'PAY_OFF'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, goalType: type })}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                        form.goalType === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50',
                      )}
                    >
                      <span>{type === 'SAVE_UP' ? '💰' : '💳'}</span>
                      {GOAL_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Jumlah (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                  <Input
                    type="text"
                    placeholder="200000000"
                    className="pl-10"
                    value={form.targetAmount ? formatNumber(Number(form.targetAmount)) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setForm({ ...form, targetAmount: raw });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi (opsional)</Label>
                <Input
                  placeholder="Keterangan goal"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Deadline (opsional)</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>

              <Button className="w-full" disabled={createMutation.isPending} onClick={handleCreate}>
                {createMutation.isPending ? 'Menyimpan...' : 'Buat Goal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-500 text-xl">flag</span>
              </div>
              <span className="text-body-sm font-medium text-muted-foreground">Total Target</span>
            </div>
            <p className="text-numeric-lg tracking-tight">{formatCurrency(summary.totalTarget)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-xl">savings</span>
              </div>
              <span className="text-body-sm font-medium text-muted-foreground">Terkumpul</span>
            </div>
            <p className="text-numeric-lg tracking-tight">{formatCurrency(summary.totalSaved)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-xl">trophy</span>
              </div>
              <span className="text-body-sm font-medium text-muted-foreground">Progress</span>
            </div>
            <p className="text-numeric-lg tracking-tight">
              <span className="text-primary">{summary.overallProgress}%</span>
              <span className="text-sm text-muted-foreground ml-2">
                ({summary.completedGoals}/{summary.totalGoals} selesai)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Goals List */}
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
      ) : goals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">flag</span>
          </div>
          <p className="font-semibold text-lg">Belum ada goal</p>
          <p className="text-sm text-muted-foreground mt-1">
            Buat goal pertama untuk mulai menabung!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const statusConfig = STATUS_CONFIG[goal.status] || STATUS_CONFIG.ACTIVE;
            return (
              <div
                key={goal.id}
                className={cn(
                  'rounded-2xl border bg-card p-5 transition-all shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover',
                  goal.status === 'COMPLETED' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border',
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/goals/${goal.id}`} className="flex items-center gap-4 min-w-0 group">
                    <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-2xl shrink-0">
                      {goal.icon || '🎯'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold group-hover:text-primary transition-colors truncate">{goal.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {GOAL_TYPE_LABELS[goal.goalType]} • {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', statusConfig.color)}>
                      {statusConfig.label}
                    </span>
                    {goal.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs gap-1"
                        onClick={() => {
                          setShowContribute(goal.id);
                          setContributeForm({
                            amount: '',
                            accountId: accounts[0]?.id || '',
                            note: '',
                          });
                        }}
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Kontribusi
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => setDeleteConfirmId(goal.id)}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </Button>
                  </div>
                </div>

                <Progress
                  value={goal.progress}
                  className={cn(
                    'h-2.5',
                    goal.status === 'COMPLETED'
                      ? '[&>div]:bg-emerald-500'
                      : goal.progress >= 75
                        ? '[&>div]:bg-amber-500'
                        : '[&>div]:bg-primary',
                  )}
                />

                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{goal.progress}% tercapai</span>
                  <div className="flex items-center gap-3">
                    {goal.suggestedMonthly && goal.status === 'ACTIVE' && (
                      <span>Target/bulan: {formatCurrency(goal.suggestedMonthly)}</span>
                    )}
                    {goal.daysRemaining !== null && goal.daysRemaining > 0 && (
                      <span>{goal.daysRemaining} hari lagi</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contribute Dialog */}
      <Dialog open={!!showContribute} onOpenChange={(open) => !open && setShowContribute(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kontribusi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Sumber Dompet / Wallet</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                value={contributeForm.accountId}
                onChange={(e) => setContributeForm({ ...contributeForm, accountId: e.target.value })}
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
                  value={contributeForm.amount ? formatNumber(Number(contributeForm.amount)) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setContributeForm({ ...contributeForm, amount: raw });
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Input
                placeholder="Bonus bulan ini"
                value={contributeForm.note}
                onChange={(e) => setContributeForm({ ...contributeForm, note: e.target.value })}
              />
            </div>
            <Button className="w-full" disabled={contributeMutation.isPending} onClick={handleContribute}>
              {contributeMutation.isPending ? 'Menyimpan...' : 'Tambah Kontribusi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus goal ini? Semua kontribusi terkait akan ikut terhapus.
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
