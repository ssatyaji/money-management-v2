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
import { useDebtDetail, useAddDebtPayment } from '@/hooks/use-debts';

export default function DebtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: debt, isLoading } = useDebtDetail(id);
  const paymentMutation = useAddDebtPayment();
  const [showPayment, setShowPayment] = useState(false);
  const [form, setForm] = useState({ amount: '', note: '' });

  const handlePayment = async () => {
    if (!form.amount) {
      toast.error('Isi jumlah pembayaran');
      return;
    }
    try {
      await paymentMutation.mutateAsync({
        debtId: id,
        data: {
          amount: Number(form.amount),
          note: form.note || undefined,
        },
      });
      toast.success('Pembayaran berhasil! ✅');
      setShowPayment(false);
      setForm({ amount: '', note: '' });
    } catch {
      toast.error('Gagal mencatat pembayaran');
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

  if (!debt) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Data tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/debts')}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/debts')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali
      </button>

      {/* Debt Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-3xl">
              {debt.type === 'RECEIVABLE' ? '📥' : '📤'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{debt.personName}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {debt.type === 'RECEIVABLE' ? 'Piutang' : 'Hutang'}
                {debt.description && ` • ${debt.description}`}
              </p>
            </div>
          </div>
          {debt.status !== 'SETTLED' && debt.status !== 'CANCELLED' && (
            <Button className="rounded-full gap-2" onClick={() => setShowPayment(true)}>
              <span className="material-symbols-outlined text-[18px]">payments</span>
              Bayar
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{formatCurrency(debt.paidAmount)}</span>
            <span className="text-muted-foreground">{formatCurrency(debt.totalAmount)}</span>
          </div>
          <Progress
            value={debt.progress}
            className={cn('h-4', debt.status === 'SETTLED' ? '[&>div]:bg-emerald-500' : '[&>div]:bg-primary')}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{debt.progress}% terbayar</span>
            <span>Sisa: {formatCurrency(debt.remainingAmount)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={cn(
              'text-sm font-semibold mt-1',
              debt.status === 'SETTLED' ? 'text-emerald-500' : debt.isOverdue ? 'text-red-500' : 'text-blue-500',
            )}>
              {debt.status === 'SETTLED' ? '✅ Lunas' : debt.isOverdue ? '🔴 Overdue' : debt.status === 'PARTIALLY_PAID' ? '🟡 Sebagian' : '🔵 Aktif'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tanggal Pinjam</p>
            <p className="text-sm font-semibold mt-1">
              {new Date(debt.borrowDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          {debt.dueDate && (
            <div>
              <p className="text-xs text-muted-foreground">Jatuh Tempo</p>
              <p className="text-sm font-semibold mt-1">
                {new Date(debt.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
          {debt.personContact && (
            <div>
              <p className="text-xs text-muted-foreground">Kontak</p>
              <p className="text-sm font-semibold mt-1">{debt.personContact}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-2xl border border-border bg-card shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
        <div className="p-6 pb-4 border-b border-border/50">
          <h3 className="text-lg font-bold">Riwayat Pembayaran</h3>
        </div>
        <div className="p-2">
          {!debt.payments || debt.payments.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl text-muted-foreground">history</span>
              </div>
              <p className="text-muted-foreground text-sm">Belum ada pembayaran</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {debt.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.note || 'Pembayaran'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input
                  type="text"
                  placeholder="1000000"
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
                placeholder="Cicilan bulan ini"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <Button className="w-full" disabled={paymentMutation.isPending} onClick={handlePayment}>
              {paymentMutation.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
