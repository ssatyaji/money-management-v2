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
  useDebts,
  useDebtSummary,
  useCreateDebt,
  useDeleteDebt,
  useAddDebtPayment,
} from '@/hooks/use-debts';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Aktif', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  PARTIALLY_PAID: { label: 'Sebagian', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  SETTLED: { label: 'Lunas', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED: { label: 'Dibatalkan', color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' },
};

export default function DebtsPage() {
  const [activeTab, setActiveTab] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [showCreate, setShowCreate] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: debts = [], isLoading } = useDebts(activeTab);
  const { data: summary } = useDebtSummary();
  const createMutation = useCreateDebt();
  const deleteMutation = useDeleteDebt();
  const paymentMutation = useAddDebtPayment();

  const [form, setForm] = useState({
    personName: '',
    type: 'RECEIVABLE' as 'RECEIVABLE' | 'PAYABLE',
    totalAmount: '',
    description: '',
    personContact: '',
    dueDate: '',
  });

  const [paymentForm, setPaymentForm] = useState({ amount: '', note: '' });

  const handleCreate = async () => {
    if (!form.personName || !form.totalAmount) {
      toast.error('Isi nama dan jumlah');
      return;
    }
    try {
      await createMutation.mutateAsync({
        personName: form.personName,
        type: form.type,
        totalAmount: Number(form.totalAmount),
        description: form.description || undefined,
        personContact: form.personContact || undefined,
        dueDate: form.dueDate || undefined,
      });
      toast.success('Hutang berhasil dicatat! 📝');
      setShowCreate(false);
      setForm({ personName: '', type: 'RECEIVABLE', totalAmount: '', description: '', personContact: '', dueDate: '' });
    } catch {
      toast.error('Gagal mencatat hutang');
    }
  };

  const handlePayment = async () => {
    if (!showPayment || !paymentForm.amount) {
      toast.error('Isi jumlah pembayaran');
      return;
    }
    try {
      await paymentMutation.mutateAsync({
        debtId: showPayment,
        data: {
          amount: Number(paymentForm.amount),
          note: paymentForm.note || undefined,
        },
      });
      toast.success('Pembayaran berhasil dicatat! ✅');
      setShowPayment(null);
      setPaymentForm({ amount: '', note: '' });
    } catch {
      toast.error('Gagal mencatat pembayaran');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirmId);
      toast.success('Catatan berhasil dihapus 🗑️');
    } catch {
      toast.error('Gagal menghapus');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hutang & Piutang</h1>
          <p className="text-muted-foreground mt-1">Catat dan lacak hutang piutang</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full px-5">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden sm:inline">Catat Baru</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Hutang/Piutang Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['RECEIVABLE', 'PAYABLE'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                        form.type === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50',
                      )}
                    >
                      <span>{type === 'RECEIVABLE' ? '📥' : '📤'}</span>
                      {type === 'RECEIVABLE' ? 'Piutang (Orang hutang ke saya)' : 'Hutang (Saya hutang ke orang)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nama Orang</Label>
                <Input
                  placeholder="Nama debitur/kreditur"
                  value={form.personName}
                  onChange={(e) => setForm({ ...form, personName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                  <Input
                    type="text"
                    placeholder="5000000"
                    className="pl-10"
                    value={form.totalAmount ? formatNumber(Number(form.totalAmount)) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setForm({ ...form, totalAmount: raw });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Keterangan (opsional)</Label>
                <Input
                  placeholder="Pinjaman untuk..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Jatuh Tempo (opsional)</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>

              <Button className="w-full" disabled={createMutation.isPending} onClick={handleCreate}>
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
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
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-xl">arrow_downward</span>
              </div>
              <span className="text-body-sm font-medium text-muted-foreground">Total Piutang</span>
            </div>
            <p className="text-numeric-lg tracking-tight text-emerald-600">{formatCurrency(summary.totalReceivable)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-xl">arrow_upward</span>
              </div>
              <span className="text-body-sm font-medium text-muted-foreground">Total Hutang</span>
            </div>
            <p className="text-numeric-lg tracking-tight text-red-600">{formatCurrency(summary.totalPayable)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-xl">balance</span>
              </div>
              <span className="text-body-sm font-medium text-muted-foreground">Posisi Bersih</span>
            </div>
            <p className={cn('text-numeric-lg tracking-tight', summary.netPosition >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {formatCurrency(summary.netPosition)}
            </p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex bg-muted/65 p-1 rounded-xl border border-border/40 text-sm font-semibold w-fit">
        <button
          onClick={() => setActiveTab('RECEIVABLE')}
          className={cn(
            'px-4 py-2 rounded-lg transition-all cursor-pointer',
            activeTab === 'RECEIVABLE'
              ? 'bg-card text-foreground shadow-sm font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          📥 Piutang
        </button>
        <button
          onClick={() => setActiveTab('PAYABLE')}
          className={cn(
            'px-4 py-2 rounded-lg transition-all cursor-pointer',
            activeTab === 'PAYABLE'
              ? 'bg-card text-foreground shadow-sm font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          📤 Hutang
        </button>
      </div>

      {/* Debt List */}
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
      ) : debts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">
              {activeTab === 'RECEIVABLE' ? 'arrow_downward' : 'arrow_upward'}
            </span>
          </div>
          <p className="font-semibold text-lg">
            Belum ada {activeTab === 'RECEIVABLE' ? 'piutang' : 'hutang'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Catatan {activeTab === 'RECEIVABLE' ? 'piutang' : 'hutang'} Anda akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => {
            const statusConfig = STATUS_CONFIG[debt.status] || STATUS_CONFIG.ACTIVE;
            return (
              <div
                key={debt.id}
                className={cn(
                  'rounded-2xl border bg-card p-5 transition-all shadow-[0px_4px_12px_rgba(26,43,60,0.05)] card-hover',
                  debt.isOverdue ? 'border-red-500/50 bg-red-500/5' : debt.status === 'SETTLED' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border',
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/debts/${debt.id}`} className="flex items-center gap-4 min-w-0 group">
                    <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-xl shrink-0">
                      {debt.type === 'RECEIVABLE' ? '📥' : '📤'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold group-hover:text-primary transition-colors truncate">{debt.personName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {debt.description || (debt.type === 'RECEIVABLE' ? 'Piutang' : 'Hutang')}
                        {debt.dueDate && ` • Jatuh tempo: ${new Date(debt.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {debt.isOverdue && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full border text-red-500 bg-red-500/10 border-red-500/20">
                        Overdue
                      </span>
                    )}
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', statusConfig.color)}>
                      {statusConfig.label}
                    </span>
                    {debt.status !== 'SETTLED' && debt.status !== 'CANCELLED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs gap-1"
                        onClick={() => setShowPayment(debt.id)}
                      >
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        Bayar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => setDeleteConfirmId(debt.id)}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </Button>
                  </div>
                </div>

                <Progress
                  value={debt.progress}
                  className={cn(
                    'h-2.5',
                    debt.status === 'SETTLED'
                      ? '[&>div]:bg-emerald-500'
                      : debt.isOverdue
                        ? '[&>div]:bg-red-500'
                        : '[&>div]:bg-primary',
                  )}
                />

                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{formatCurrency(debt.paidAmount)} / {formatCurrency(debt.totalAmount)}</span>
                  <span>Sisa: {formatCurrency(debt.remainingAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={!!showPayment} onOpenChange={(open) => !open && setShowPayment(null)}>
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
                  value={paymentForm.amount ? formatNumber(Number(paymentForm.amount)) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setPaymentForm({ ...paymentForm, amount: raw });
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Input
                placeholder="Cicilan bulan ini"
                value={paymentForm.note}
                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
              />
            </div>
            <Button className="w-full" disabled={paymentMutation.isPending} onClick={handlePayment}>
              {paymentMutation.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus catatan ini?</DialogDescription>
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
