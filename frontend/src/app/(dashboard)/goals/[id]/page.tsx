'use client';

import { useState } from 'react';
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
import { useSavingGoalDetail, useAddContribution } from '@/hooks/use-saving-goals';

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
  const [showContribute, setShowContribute] = useState(false);
  const [form, setForm] = useState({ amount: '', note: '' });

  const handleContribute = async () => {
    if (!form.amount) {
      toast.error('Isi jumlah kontribusi');
      return;
    }
    try {
      await contributeMutation.mutateAsync({
        goalId: id,
        data: {
          amount: Number(form.amount),
          note: form.note || undefined,
        },
      });
      toast.success('Kontribusi berhasil! 💰');
      setShowContribute(false);
      setForm({ amount: '', note: '' });
    } catch {
      toast.error('Gagal menambahkan kontribusi');
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
            <Button className="rounded-full gap-2" onClick={() => setShowContribute(true)}>
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
    </div>
  );
}
