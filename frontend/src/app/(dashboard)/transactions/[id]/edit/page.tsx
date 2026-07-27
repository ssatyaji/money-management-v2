'use client';

import { use, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCategories, useTransaction, useUpdateTransaction } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { formatNumber, formatCurrency } from '@/lib/utils/currency';

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
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Dompet asal wajib dipilih', path: ['accountId'] });
    }
    if (!data.destinationAccountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Dompet tujuan wajib dipilih', path: ['destinationAccountId'] });
    }
    if (data.accountId && data.destinationAccountId && data.accountId === data.destinationAccountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Dompet tujuan harus berbeda dari dompet asal', path: ['destinationAccountId'] });
    }
  } else {
    if (!data.categoryId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Kategori wajib dipilih', path: ['categoryId'] });
    }
  }
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

function FieldWrapper({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function inputCls(hasError?: boolean) {
  return cn(
    'w-full h-11 px-3.5 rounded-xl border bg-background text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-border hover:border-border/80 focus:border-primary'
  );
}

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: transaction, isLoading: isLoadingTx, isError } = useTransaction(id);
  const updateMutation = useUpdateTransaction();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();

  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '12:00',
      amount: undefined,
      categoryId: '',
      accountId: '',
      destinationAccountId: '',
    },
  });

  // Populate form with existing transaction data
  useEffect(() => {
    if (transaction) {
      const txDate = new Date(transaction.date);
      const dateStr = format(txDate, 'yyyy-MM-dd');
      const timeStr = format(txDate, 'HH:mm');

      setSelectedType(transaction.type);
      reset({
        type: transaction.type,
        amount: Number(transaction.amount),
        description: transaction.description || '',
        note: transaction.note || '',
        date: dateStr,
        time: timeStr,
        categoryId: transaction.categoryId || '',
        accountId: transaction.accountId || 'main',
        destinationAccountId: transaction.destinationAccountId || 'main',
      });
    }
  }, [transaction, reset]);

  const watchedAccountId = watch('accountId');
  const watchedDestAccountId = watch('destinationAccountId');

  const selectedSourceAccount = accounts.find((acc) => acc.id === watchedAccountId);

  const onTypeChange = (type: 'INCOME' | 'EXPENSE' | 'TRANSFER') => {
    setSelectedType(type);
    setValue('type', type);
    if (type === 'TRANSFER') {
      setValue('categoryId', 'transfer-dummy');
    }
  };

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      const [year, month, day] = data.date.split('-').map(Number);
      const [hours, minutes] = (data.time || '00:00').split(':').map(Number);
      const transactionDate = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, 0, 0));

      await updateMutation.mutateAsync({
        id,
        data: {
          amount: data.amount,
          type: data.type,
          description: data.description,
          note: data.note,
          categoryId: data.type === 'TRANSFER' ? 'transfer-dummy' : data.categoryId!,
          accountId: data.accountId === 'main' ? undefined : data.accountId,
          destinationAccountId: data.type === 'TRANSFER' ? (data.destinationAccountId === 'main' ? undefined : data.destinationAccountId) : undefined,
          date: transactionDate.toISOString(),
        },
      });

      toast.success('Transaksi berhasil diperbarui! 🎉');
      router.push(`/transactions/${id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Gagal memperbarui transaksi');
    }
  };

  if (isLoadingTx) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
        <h2 className="text-xl font-bold">Transaksi tidak ditemukan</h2>
        <Button onClick={() => router.push('/transactions')}>Kembali</Button>
      </div>
    );
  }

  const typeButtons: { type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; label: string; icon: string; activeClass: string }[] = [
    { type: 'EXPENSE', label: 'Pengeluaran', icon: 'payments', activeClass: 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400' },
    { type: 'INCOME', label: 'Pemasukan', icon: 'account_balance_wallet', activeClass: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { type: 'TRANSFER', label: 'Transfer', icon: 'swap_horiz', activeClass: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  ];

  const filteredCategories = categories.filter((cat) => cat.type === selectedType);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Transaksi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Ubah rincian transaksi, tipe, atau dompet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* ── Transaction Type ────────────────────────────── */}
        <FieldWrapper label="Tipe Transaksi">
          <div className="grid grid-cols-3 gap-2">
            {typeButtons.map(({ type, label, icon, activeClass }) => (
              <button
                key={type}
                type="button"
                onClick={() => onTypeChange(type)}
                className={cn(
                  'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer',
                  selectedType === type
                    ? activeClass
                    : 'border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40'
                )}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </FieldWrapper>

        {/* ── Amount ──────────────────────────────────────── */}
        <FieldWrapper label="Jumlah (Rp)" error={errors.amount?.message}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold pointer-events-none select-none">
              Rp
            </span>
            <Controller
              name="amount"
              control={control}
              render={({ field: { onChange, value, ...fieldProps } }) => {
                const displayValue = value !== undefined && value !== null ? formatNumber(Number(value)) : '';
                return (
                  <input
                    {...fieldProps}
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className={cn(inputCls(!!errors.amount), 'pl-10 text-lg font-bold')}
                    value={displayValue}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      onChange(rawValue ? Number(rawValue) : undefined);
                    }}
                  />
                );
              }}
            />
          </div>
        </FieldWrapper>

        {/* ── Category (Expense / Income) ──────────────────── */}
        {selectedType !== 'TRANSFER' && (
          <FieldWrapper label="Kategori" error={errors.categoryId?.message}>
            {isLoadingCategories ? (
              <div className="h-11 rounded-xl border border-border bg-muted/40 animate-pulse" />
            ) : (
              <select
                {...register('categoryId')}
                className={cn(inputCls(!!errors.categoryId), 'cursor-pointer')}
              >
                <option value="">-- Pilih Kategori --</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </option>
                ))}
              </select>
            )}
          </FieldWrapper>
        )}

        {/* ── Wallet (Income / Expense) ─────────────────────── */}
        {selectedType !== 'TRANSFER' && (
          <FieldWrapper label="Dompet / Akun">
            {isLoadingAccounts ? (
              <div className="h-11 rounded-xl border border-border bg-muted/40 animate-pulse" />
            ) : (
              <select
                {...register('accountId')}
                className={cn(inputCls(!!errors.accountId), 'cursor-pointer')}
              >
                <option value="main">💳 Saldo Utama</option>
                {accounts
                  .filter((acc) => acc.id !== 'main')
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      🏦 {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
              </select>
            )}
          </FieldWrapper>
        )}

        {/* ── Transfer Wallets (Source & Destination) ───────── */}
        {selectedType === 'TRANSFER' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Dompet Asal" error={errors.accountId?.message}>
              <select
                {...register('accountId')}
                className={cn(inputCls(!!errors.accountId), 'cursor-pointer')}
              >
                <option value="main">💳 Saldo Utama</option>
                {accounts
                  .filter((acc) => acc.id !== 'main')
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      🏦 {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
              </select>
            </FieldWrapper>

            <FieldWrapper label="Dompet Tujuan" error={errors.destinationAccountId?.message}>
              <select
                {...register('destinationAccountId')}
                className={cn(inputCls(!!errors.destinationAccountId), 'cursor-pointer')}
              >
                <option value="">-- Pilih Dompet Tujuan --</option>
                <option value="main">💳 Saldo Utama</option>
                {accounts
                  .filter((acc) => acc.id !== 'main')
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      🏦 {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
              </select>
            </FieldWrapper>
          </div>
        )}

        {/* ── Date & Time Inputs ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrapper label="Tanggal" error={errors.date?.message}>
            <input
              type="date"
              {...register('date')}
              className={cn(inputCls(!!errors.date), 'cursor-pointer')}
            />
          </FieldWrapper>

          <FieldWrapper label="Waktu (Jam)" error={errors.time?.message}>
            <div className="flex flex-col gap-2">
              <input
                type="time"
                {...register('time')}
                className={cn(inputCls(!!errors.time), 'cursor-pointer')}
              />
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Sekarang', getVal: () => `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` },
                  { label: '12:30', val: '12:30' },
                  { label: '19:00', val: '19:00' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setValue('time', preset.val || preset.getVal!())}
                    className="text-[11px] font-semibold px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </FieldWrapper>
        </div>

        {/* ── Description ────────────────────────────────── */}
        <FieldWrapper label="Deskripsi (Opsional)">
          <input
            type="text"
            placeholder="Misal: Makan Siang Nasi Padang / Transfer Gaji"
            {...register('description')}
            className={inputCls()}
          />
        </FieldWrapper>

        {/* ── Notes ──────────────────────────────────────── */}
        <FieldWrapper label="Catatan Tambahan (Opsional)">
          <textarea
            rows={3}
            placeholder="Tambah catatan detail..."
            {...register('note')}
            className="w-full p-3 rounded-xl border border-border bg-background text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border/80 focus:border-primary resize-none"
          />
        </FieldWrapper>

        {/* ── Submit Button ───────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 h-12 rounded-xl"
            disabled={updateMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex-1 h-12 rounded-xl bg-primary font-bold text-sm text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
