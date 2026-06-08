'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCategories, useCreateTransaction } from '@/hooks/use-transactions';

const transactionSchema = z.object({
  amount: z.number().min(1, 'Jumlah harus lebih dari 0'),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().optional(),
  note: z.string().optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function NewTransactionPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const { data: categories = [], isLoading: loadingCategories } = useCategories(selectedType);
  const createMutation = useCreateTransaction();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      amount: undefined,
      categoryId: '',
    },
  });

  const watchedCategoryId = watch('categoryId');

  const onTypeChange = (type: 'INCOME' | 'EXPENSE') => {
    setSelectedType(type);
    setValue('type', type);
    setValue('categoryId', '');
  };

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        date: new Date(data.date).toISOString(),
      });
      toast.success('Transaksi berhasil ditambahkan! 🎉');
      router.push('/transactions');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Gagal menambahkan transaksi');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/transactions">
          <Button variant="ghost" size="icon" className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tambah Transaksi</h1>
          <p className="text-muted-foreground text-sm">Catat pemasukan atau pengeluaran baru</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Detail Transaksi</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            {/* Type Toggle */}
            <div className="space-y-2">
              <Label>Tipe Transaksi</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onTypeChange('INCOME')}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm',
                    selectedType === 'INCOME'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                      : 'border-border text-muted-foreground hover:border-emerald-500/50',
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => onTypeChange('EXPENSE')}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm',
                    selectedType === 'EXPENSE'
                      ? 'border-red-500 bg-red-500/10 text-red-600'
                      : 'border-border text-muted-foreground hover:border-red-500/50',
                  )}
                >
                  <TrendingDown className="w-4 h-4" />
                  Pengeluaran
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  Rp
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  className={cn('pl-10 text-lg font-semibold', errors.amount && 'border-destructive')}
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Kategori</Label>
              {loadingCategories ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setValue('categoryId', cat.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all',
                        watchedCategoryId === cat.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50',
                      )}
                    >
                      <span className="text-lg">{cat.icon || '📦'}</span>
                      <span className="truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  className={cn('pl-10', errors.date && 'border-destructive')}
                  {...register('date')}
                />
              </div>
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                placeholder="Misal: Belanja bulanan di Indomaret"
                {...register('description')}
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Catatan (opsional)</Label>
              <Textarea
                id="note"
                placeholder="Catatan tambahan..."
                rows={3}
                {...register('note')}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan Transaksi'
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
