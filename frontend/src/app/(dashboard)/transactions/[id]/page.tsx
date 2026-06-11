'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Trash2,
  CalendarDays,
  Wallet,
  Tag,
  AlignLeft,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import { useTransaction, useDeleteTransaction } from '@/hooks/use-transactions';
import { formatCurrency } from '@/lib/utils/currency';
import { formatTransactionDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: transaction, isLoading, isError } = useTransaction(id);
  const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    deleteTx(id, {
      onSuccess: () => {
        toast.success('Transaksi berhasil dihapus 🗑️');
        router.push('/transactions');
      },
      onError: () => {
        toast.error('Gagal menghapus transaksi');
        setShowDeleteDialog(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-24 h-4" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="w-full h-32" />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-12" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-muted-foreground">error</span>
        </div>
        <h2 className="text-xl font-bold">Transaksi Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-6">
          Transaksi yang Anda cari mungkin sudah dihapus atau tidak tersedia.
        </p>
        <Link href="/transactions">
          <Button variant="default">Kembali ke Riwayat</Button>
        </Link>
      </div>
    );
  }

  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Transaksi</h1>
            <p className="text-muted-foreground text-sm">Informasi lengkap transaksi</p>
          </div>
        </div>
        <Button 
          variant="destructive" 
          size="sm" 
          className="gap-2 rounded-full px-4"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Hapus</span>
        </Button>
      </div>

      {/* Main Content */}
      <Card className="border-border/50 overflow-hidden shadow-[0px_4px_12px_rgba(26,43,60,0.05)] rounded-2xl">
        {/* Amount Section */}
        <div className={cn(
          "p-8 text-center flex flex-col items-center justify-center relative",
          isTransfer ? "bg-indigo-500/5" : (isIncome ? "bg-emerald-500/5" : "bg-red-500/5")
        )}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm"
            style={{
              backgroundColor: transaction.category?.color ? `${transaction.category.color}20` : 'var(--muted)',
              color: transaction.category?.color || 'inherit',
            }}
          >
            {isTransfer ? '🔄' : (transaction.category?.icon || '📦')}
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {isTransfer ? 'Transfer Dana' : (isIncome ? 'Pemasukan' : 'Pengeluaran')}
          </p>
          <h2 className={cn(
            "text-4xl sm:text-5xl font-bold tracking-tight",
            isTransfer ? "text-indigo-600 dark:text-indigo-400" : (isIncome ? "text-emerald-500" : "text-red-500")
          )}>
            {isTransfer ? '' : (isIncome ? '+' : '-')}{formatCurrency(Number(transaction.amount))}
          </h2>
          {transaction.description && (
            <p className="mt-4 text-lg font-medium text-foreground">
              {transaction.description}
            </p>
          )}
        </div>

        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {/* Date */}
            <div className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="p-2 bg-muted rounded-lg">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <span className="font-medium">Tanggal</span>
              </div>
              <span className="font-medium text-foreground text-right">
                {formatTransactionDate(transaction.date)}
              </span>
            </div>

            {/* Category */}
            {!isTransfer && (
              <div className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-2 bg-muted rounded-lg">
                    <Tag className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Kategori</span>
                </div>
                <Badge variant="outline" className="text-sm py-1">
                  {transaction.category?.name || 'Tidak ada kategori'}
                </Badge>
              </div>
            )}

            {/* Wallet / Account */}
            {!isTransfer ? (
              <div className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-2 bg-muted rounded-lg">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Dompet / Akun</span>
                </div>
                <Badge variant="secondary" className="text-sm py-1 bg-primary/10 text-primary border-none">
                  {transaction.account?.name || 'Saldo Utama'}
                </Badge>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="p-2 bg-muted rounded-lg">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Dompet Asal</span>
                  </div>
                  <Badge variant="secondary" className="text-sm py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none">
                    {transaction.account?.name || 'Saldo Utama'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="p-2 bg-muted rounded-lg">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Dompet Tujuan</span>
                  </div>
                  <Badge variant="secondary" className="text-sm py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none">
                    {transaction.destinationAccount?.name || 'Saldo Utama'}
                  </Badge>
                </div>
              </>
            )}

            {/* Note */}
            {transaction.note && (
              <div className="flex flex-col gap-2 p-5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-2 bg-muted rounded-lg">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Catatan Tambahan</span>
                </div>
                <div className="mt-2 p-4 bg-muted/50 rounded-xl text-sm leading-relaxed border border-border/50">
                  {transaction.note}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Transaksi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan dan akan mempengaruhi total saldo Anda.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Menghapus...' : 'Hapus Transaksi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
