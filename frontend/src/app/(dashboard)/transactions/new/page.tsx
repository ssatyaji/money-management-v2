'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  CalendarIcon,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCategories, useCreateTransaction } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { formatNumber, formatCurrency } from '@/lib/utils/currency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const transactionSchema = z.object({
  amount: z.number().min(1, 'Jumlah harus lebih dari 0'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  description: z.string().optional(),
  note: z.string().optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  time: z.string().min(1, 'Waktu wajib diisi'),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  destinationAccountId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'TRANSFER') {
    if (!data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dompet asal wajib dipilih',
        path: ['accountId'],
      });
    }
    if (!data.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dompet tujuan wajib dipilih',
        path: ['destinationAccountId'],
      });
    }
    if (data.accountId && data.destinationAccountId && data.accountId === data.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dompet tujuan tidak boleh sama dengan dompet asal',
        path: ['destinationAccountId'],
      });
    }
  } else {
    if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kategori wajib dipilih',
        path: ['categoryId'],
      });
    }
  }
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function NewTransactionPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const { data: categories = [], isLoading: loadingCategories } = useCategories(selectedType);
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateTransaction();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      amount: undefined,
      categoryId: '',
      accountId: 'main',
      destinationAccountId: '',
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedCategoryId = watch('categoryId');
  const watchedAccountId = watch('accountId');
  const watchedDestAccountId = watch('destinationAccountId');

  const selectedSourceAccount = accounts.find((acc) => acc.id === watchedAccountId);
  const selectedDestAccount = accounts.find((acc) => acc.id === watchedDestAccountId);

  const onTypeChange = (type: 'INCOME' | 'EXPENSE' | 'TRANSFER') => {
    setSelectedType(type);
    setValue('type', type);
    setValue('categoryId', type === 'TRANSFER' ? 'transfer-dummy' : '');
  };

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      const [year, month, day] = data.date.split('-').map(Number);
      const [hours, minutes] = (data.time || '00:00').split(':').map(Number);
      const transactionDate = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
        0,
        0
      );

      await createMutation.mutateAsync({
        amount: data.amount,
        type: data.type,
        description: data.description,
        note: data.note,
        categoryId: data.type === 'TRANSFER' ? 'transfer-dummy' : data.categoryId!,
        accountId: data.accountId,
        destinationAccountId: data.type === 'TRANSFER' ? data.destinationAccountId : undefined,
        date: transactionDate.toISOString(),
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
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onTypeChange('INCOME')}
                  className={cn(
                    'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 transition-all font-medium text-xs sm:text-sm',
                    selectedType === 'INCOME'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                      : 'border-border text-muted-foreground hover:border-emerald-500/50',
                  )}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => onTypeChange('EXPENSE')}
                  className={cn(
                    'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 transition-all font-medium text-xs sm:text-sm',
                    selectedType === 'EXPENSE'
                      ? 'border-red-500 bg-red-500/10 text-red-600'
                      : 'border-border text-muted-foreground hover:border-red-500/50',
                  )}
                >
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => onTypeChange('TRANSFER')}
                  className={cn(
                    'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 transition-all font-medium text-xs sm:text-sm',
                    selectedType === 'TRANSFER'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600'
                      : 'border-border text-muted-foreground hover:border-indigo-500/50',
                  )}
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0" />
                  Transfer
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
                <Controller
                  name="amount"
                  control={control}
                  render={({ field: { onChange, value, ...fieldProps } }) => {
                    const displayValue = value !== undefined && value !== null ? formatNumber(Number(value)) : '';
                    return (
                      <Input
                        {...fieldProps}
                        id="amount"
                        type="text"
                        placeholder="0"
                        className={cn(
                          'pl-10 text-lg font-semibold', 
                          errors.amount && 'border-destructive',
                          selectedType === 'TRANSFER' && selectedSourceAccount && 'pr-16'
                        )}
                        value={displayValue}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/[^0-9]/g, '');
                          const numValue = rawValue ? Number(rawValue) : undefined;
                          onChange(numValue);
                        }}
                      />
                    );
                  }}
                />
                {selectedType === 'TRANSFER' && selectedSourceAccount && (
                  <button
                    type="button"
                    onClick={() => setValue('amount', selectedSourceAccount.balance)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-1 rounded transition-colors"
                  >
                    Max
                  </button>
                )}
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Category */}
            {selectedType !== 'TRANSFER' && (
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
            )}

            {/* Account Selector (For Income / Expense) */}
            {selectedType !== 'TRANSFER' && accounts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="accountId">Dompet / Rekening</Label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih Dompet (Opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {/* Source and Destination Wallet Selectors for Transfer */}
            {selectedType === 'TRANSFER' && accounts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountId">Dompet Asal</Label>
                  <Controller
                    name="accountId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Pilih Dompet Asal" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {selectedSourceAccount && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Saldo tersedia: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{formatCurrency(selectedSourceAccount.balance)}</strong>
                    </p>
                  )}
                  {errors.accountId && (
                    <p className="text-sm text-destructive">{errors.accountId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinationAccountId">Dompet Tujuan</Label>
                  <Controller
                    name="destinationAccountId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Pilih Dompet Tujuan" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {selectedDestAccount && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Saldo saat ini: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(selectedDestAccount.balance)}</strong>
                    </p>
                  )}
                  {errors.destinationAccountId && (
                    <p className="text-sm text-destructive">{errors.destinationAccountId.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div className="space-y-2">
              <Label>Tanggal &amp; Waktu</Label>
              <div className="flex gap-2">
                {/* Date Picker */}
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => {
                    const dateValue = field.value ? new Date(field.value) : new Date();
                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'flex-1 pl-3 text-left font-normal h-9 bg-background border-input hover:bg-accent/50 justify-start',
                              !field.value && 'text-muted-foreground',
                              errors.date && 'border-destructive'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {field.value ? (
                                format(dateValue, 'dd MMM yyyy', { locale: id })
                              ) : (
                                <span>Pilih Tanggal</span>
                              )}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateValue}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = format(date, 'yyyy-MM-dd');
                                field.onChange(formattedDate);
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
                {/* Time Input */}
                <Input
                  type="time"
                  className={cn('w-32 h-9 bg-background border-input', errors.time && 'border-destructive')}
                  {...register('time')}
                />
              </div>
              {(errors.date || errors.time) && (
                <p className="text-sm text-destructive">{errors.date?.message || errors.time?.message}</p>
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
