'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCategories, useCreateTransaction } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts'
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
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Dompet tujuan tidak boleh sama dengan dompet asal', path: ['destinationAccountId'] });
    }
  } else {
    if (!data.categoryId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Kategori wajib dipilih', path: ['categoryId'] });
    }
  }
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

// ─── Reusable field wrapper ───────────────────────────────────────────────────
function FieldWrapper({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Input base style ─────────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  cn(
    'w-full bg-muted/60 dark:bg-muted/40 text-foreground border border-border rounded-xl px-4 py-3 text-sm font-medium',
    'placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
    'transition-all duration-200',
    hasError && 'border-destructive focus:border-destructive focus:ring-destructive/20'
  );

// ─── Native select style ──────────────────────────────────────────────────────
const selectCls = (hasError?: boolean) =>
  cn(
    'w-full appearance-none bg-muted/60 dark:bg-muted/40 text-foreground border border-border rounded-xl px-4 py-3 pr-10 text-sm font-medium',
    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
    'transition-all duration-200 cursor-pointer',
    hasError && 'border-destructive'
  );

export default function NewTransactionPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [showDatePicker, setShowDatePicker] = useState(false);
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
      date: format(new Date(), 'yyyy-MM-dd'),
      time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      amount: undefined,
      categoryId: '',
      accountId: '',
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
      const transactionDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

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

  // Type button config
  const typeButtons: { type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; label: string; icon: string; activeClass: string }[] = [
    { type: 'INCOME',   label: 'Pemasukan',  icon: 'trending_up',   activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { type: 'EXPENSE',  label: 'Pengeluaran', icon: 'trending_down', activeClass: 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400' },
    { type: 'TRANSFER', label: 'Transfer',   icon: 'swap_horiz',    activeClass: 'border-primary bg-primary/10 text-primary' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Tambah Transaksi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Catat pemasukan atau pengeluaran baru</p>
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
                  'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all duration-200',
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
                    className={cn(inputCls(!!errors.amount), 'pl-10 text-lg font-bold', selectedType === 'TRANSFER' && selectedSourceAccount && 'pr-16')}
                    value={displayValue}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      onChange(rawValue ? Number(rawValue) : undefined);
                    }}
                  />
                );
              }}
            />
            {selectedType === 'TRANSFER' && selectedSourceAccount && (
              <button
                type="button"
                onClick={() => setValue('amount', selectedSourceAccount.balance)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-lg transition-colors"
              >
                Max
              </button>
            )}
          </div>
        </FieldWrapper>

        {/* ── Category ─────────────────────────────────────── */}
        {selectedType !== 'TRANSFER' && (
          <FieldWrapper label="Kategori" error={errors.categoryId?.message}>
            {loadingCategories ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
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
                      'flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-semibold transition-all duration-200',
                      watchedCategoryId === cat.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40'
                    )}
                  >
                    <span className="text-xl">{cat.icon || '📦'}</span>
                    <span className="truncate w-full text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </FieldWrapper>
        )}

        {/* ── Wallet (Income / Expense) ────────────────────── */}
        {selectedType !== 'TRANSFER' && accounts.length > 0 && (
          <FieldWrapper label="Dompet / Rekening">
            <div className="relative">
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <select
                    className={selectCls()}
                    value={field.value || ''}
                    onChange={field.onChange}
                  >
                    <option value="">Pilih Dompet (Opsional)</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                )}
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[20px]">
                expand_more
              </span>
            </div>
          </FieldWrapper>
        )}

        {/* ── Transfer Wallets ────────────────────────────── */}
        {selectedType === 'TRANSFER' && accounts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Source */}
            <FieldWrapper label="Dompet Asal" error={errors.accountId?.message}>
              <div className="relative">
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <select
                      className={selectCls(!!errors.accountId)}
                      value={field.value || ''}
                      onChange={field.onChange}
                    >
                      <option value="">Pilih Dompet Asal</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  )}
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
              {selectedSourceAccount && (
                <p className="text-[11px] text-muted-foreground">
                  Saldo tersedia:{' '}
                  <strong className="text-primary font-semibold">{formatCurrency(selectedSourceAccount.balance)}</strong>
                </p>
              )}
            </FieldWrapper>

            {/* Destination */}
            <FieldWrapper label="Dompet Tujuan" error={errors.destinationAccountId?.message}>
              <div className="relative">
                <Controller
                  name="destinationAccountId"
                  control={control}
                  render={({ field }) => (
                    <select
                      className={selectCls(!!errors.destinationAccountId)}
                      value={field.value || ''}
                      onChange={field.onChange}
                    >
                      <option value="">Pilih Dompet Tujuan</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  )}
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
              {selectedDestAccount && (
                <p className="text-[11px] text-muted-foreground">
                  Saldo saat ini:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(selectedDestAccount.balance)}</strong>
                </p>
              )}
            </FieldWrapper>
          </div>
        )}

        {/* ── Date & Time ──────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal &amp; Waktu</span>

          {/* Unified date+time container */}
          <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">

            {/* Date chips row */}
            <Controller
              name="date"
              control={control}
              render={({ field }) => {
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                const isToday = field.value === today;
                const isYesterday = field.value === yesterday;
                const isOther = !isToday && !isYesterday;

                const otherLabel = isOther && field.value
                  ? new Date(field.value + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : 'Pilih tanggal';

                return (
                  <div className="flex flex-col">
                    {/* Chip row */}
                    <div className="flex items-stretch divide-x divide-border">
                      <button
                        type="button"
                        onClick={() => { field.onChange(today); setShowDatePicker(false); }}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all duration-200',
                          isToday
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span className="material-symbols-outlined text-[15px] leading-none">today</span>
                        Hari ini
                      </button>
                      <button
                        type="button"
                        onClick={() => { field.onChange(yesterday); setShowDatePicker(false); }}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all duration-200',
                          isYesterday
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        Kemarin
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all duration-200',
                          isOther
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span className="material-symbols-outlined text-[15px] leading-none">calendar_month</span>
                        {otherLabel}
                      </button>
                    </div>

                    {/* Expandable date input */}
                    {(showDatePicker || isOther) && (
                      <div className="border-t border-border px-3 py-2">
                        <input
                          type="date"
                          value={field.value}
                          onChange={(e) => { field.onChange(e.target.value); setShowDatePicker(false); }}
                          className="w-full bg-transparent text-foreground text-sm font-medium focus:outline-none"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Time row */}
            <Controller
              name="time"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-muted-foreground leading-none shrink-0">schedule</span>
                    <span className="text-xs font-semibold text-muted-foreground">Waktu:</span>
                    <input
                      type="time"
                      value={field.value || '12:00'}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={cn(
                        'bg-muted/80 dark:bg-muted/50 text-foreground font-bold text-sm rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border cursor-pointer transition-colors',
                        errors.time && 'border-destructive text-destructive'
                      )}
                    />
                  </div>
                  {/* Preset waktu cepat */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                        field.onChange(nowTime);
                      }}
                      className="px-2.5 py-1 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      Sekarang
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('12:30')}
                      className="px-2.5 py-1 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      12:30
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('19:00')}
                      className="px-2.5 py-1 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      19:00
                    </button>
                  </div>
                </div>
              )}
            />
          </div>

          {(errors.date || errors.time) && (
            <p className="text-xs text-destructive">{errors.date?.message || errors.time?.message}</p>
          )}
        </div>

        {/* ── Description ──────────────────────────────────── */}
        <FieldWrapper label="Deskripsi">
          <input
            id="description"
            type="text"
            placeholder="Misal: Belanja bulanan di Indomaret"
            className={inputCls()}
            {...register('description')}
          />
        </FieldWrapper>

        {/* ── Note ─────────────────────────────────────────── */}
        <FieldWrapper label="Catatan (opsional)">
          <textarea
            id="note"
            placeholder="Catatan tambahan..."
            rows={3}
            className={cn(inputCls(), 'resize-y min-h-[88px]')}
            {...register('note')}
          />
        </FieldWrapper>

        {/* ── Actions ──────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 sm:flex-none sm:w-1/3 border border-border text-foreground font-semibold text-sm py-3 px-6 rounded-xl hover:bg-muted/60 transition-all duration-200 active:scale-[0.98]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 bg-primary text-primary-foreground font-bold text-sm py-3 px-6 rounded-xl hover:opacity-90 transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Transaksi'
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
