'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CalendarDays,
  CreditCard,
  Tag,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { formatTransactionDate } from '@/lib/utils/date';
import { useCategories } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import {
  useRecurringTransactions,
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
  useDeleteRecurringTransaction,
} from '@/hooks/use-recurring-transactions';

const recurringSchema = z.object({
  amount: z.number().min(1, 'Jumlah harus lebih dari 0'),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  note: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  accountId: z.string().min(1, 'Dompet wajib dipilih'),
  isActive: z.boolean(),
  enableNotification: z.boolean(),
  notifyBeforeDays: z.number().min(0, 'Minimal 0 hari').max(30, 'Maksimal 30 hari').optional().nullable(),
});

type RecurringFormValues = z.infer<typeof recurringSchema>;

export default function RecurringTransactionsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const { data: list = [], isLoading } = useRecurringTransactions();
  const { data: categories = [] } = useCategories(selectedType);
  const { data: accounts = [] } = useAccounts();

  const createMutation = useCreateRecurringTransaction();
  const updateMutation = useUpdateRecurringTransaction();
  const deleteMutation = useDeleteRecurringTransaction();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      amount: undefined,
      description: '',
      note: '',
      categoryId: '',
      accountId: 'main',
      isActive: true,
      enableNotification: false,
      notifyBeforeDays: 1,
    },
  });

  const watchedCategoryId = watch('categoryId');
  const watchedEnableNotification = watch('enableNotification');

  const onTypeChange = (type: 'INCOME' | 'EXPENSE') => {
    setSelectedType(type);
    setValue('type', type);
    setValue('categoryId', '');
  };

  const onSubmit = async (data: RecurringFormValues) => {
    try {
      await createMutation.mutateAsync({
        amount: data.amount,
        type: data.type,
        description: data.description,
        note: data.note,
        frequency: data.frequency,
        startDate: new Date(data.startDate).toISOString(),
        categoryId: data.categoryId,
        accountId: data.accountId,
        isActive: data.isActive,
        notifyBeforeDays: data.enableNotification ? Number(data.notifyBeforeDays) : null,
      });
      toast.success('Tagihan berulang berhasil ditambahkan! 🎉');
      setIsOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menambahkan tagihan berulang');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { isActive: !currentStatus },
      });
      toast.success(`Tagihan ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template tagihan berulang ini?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Tagihan berulang berhasil dihapus');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus tagihan berulang');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/transactions" className="shrink-0">
            <Button variant="ghost" size="icon" className="rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Tagihan Berulang & Langganan</h1>
            <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Kelola transaksi otomatis yang terjadwal</p>
          </div>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2 self-end sm:self-auto shrink-0">
          <Plus className="w-4 h-4" />
          <span>Tambah Tagihan</span>
        </Button>
      </div>

      {/* Main List */}
      <div className="rounded-2xl border border-border/80 bg-card/65 backdrop-blur-md overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center h-12 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
              <Clock className="w-7 h-7" />
            </div>
            <p className="font-semibold text-foreground">Belum ada tagihan berulang</p>
            <p className="text-sm text-muted-foreground mt-1">
              Catat langganan Netflix, internet, atau pengeluaran bulanan lainnya di sini.
            </p>
            <Button onClick={() => setIsOpen(true)} size="sm" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Tambah Sekarang
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {list.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-5 hover:bg-accent/40 transition-colors gap-4",
                  !item.isActive && "opacity-60"
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 border border-border/40"
                    style={{
                      backgroundColor: item.category?.color ? `${item.category.color}15` : undefined,
                    }}
                  >
                    {item.category?.icon || '📦'}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {item.category?.name || 'Lainnya'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        {item.account?.name || 'Saldo Utama'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                        {item.frequency === 'DAILY' && 'Harian'}
                        {item.frequency === 'WEEKLY' && 'Mingguan'}
                        {item.frequency === 'MONTHLY' && 'Bulanan'}
                        {item.frequency === 'YEARLY' && 'Tahunan'}
                      </span>
                      {item.notifyBeforeDays !== null && item.notifyBeforeDays !== undefined && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium" title={`Pengingat dikirim ${item.notifyBeforeDays} hari sebelum jatuh tempo`}>
                            <Bell className="w-3.5 h-3.5 shrink-0" />
                            Ingatkan H-{item.notifyBeforeDays}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right flex flex-col items-end">
                    <span
                      className={cn(
                        'font-bold text-sm sm:text-base',
                        item.type === 'INCOME' ? 'text-emerald-600' : 'text-foreground'
                      )}
                    >
                      {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(item.amount))}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      Jatuh Tempo: {formatTransactionDate(item.nextDueDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 border-l border-border/50 pl-3">
                    <button
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                      title={item.isActive ? "Nonaktifkan" : "Aktifkan"}
                      className="text-muted-foreground hover:text-foreground p-1.5 transition-colors cursor-pointer"
                    >
                      {item.isActive ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Hapus"
                      className="text-muted-foreground hover:text-destructive p-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Tambah Tagihan Berulang</DialogTitle>
            <DialogDescription>
              Buat template otomatis untuk pemasukan atau pengeluaran terjadwal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Type Toggle */}
            <div className="space-y-1.5">
              <Label>Tipe Transaksi</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onTypeChange('INCOME')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 rounded-xl border-2 transition-all font-medium text-xs sm:text-sm cursor-pointer',
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
                    'flex items-center justify-center gap-2 py-2 rounded-xl border-2 transition-all font-medium text-xs sm:text-sm cursor-pointer',
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

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description">Nama Tagihan / Deskripsi</Label>
              <Input
                id="description"
                placeholder="Contoh: Langganan Netflix Premium"
                {...register('description')}
                className="rounded-xl h-10"
              />
              {errors.description && <p className="text-xs text-destructive mt-0.5">{errors.description.message}</p>}
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <Label htmlFor="amount">Jumlah Nominal (Rp)</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    className="rounded-xl h-10"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    value={field.value || ''}
                  />
                )}
              />
              {errors.amount && <p className="text-xs text-destructive mt-0.5">{errors.amount.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Frequency */}
              <div className="space-y-1">
                <Label htmlFor="frequency">Frekuensi</Label>
                <Controller
                  name="frequency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-xl h-10 bg-background">
                        <SelectValue placeholder="Pilih Frekuensi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Setiap Hari</SelectItem>
                        <SelectItem value="WEEKLY">Setiap Minggu</SelectItem>
                        <SelectItem value="MONTHLY">Setiap Bulan</SelectItem>
                        <SelectItem value="YEARLY">Setiap Tahun</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <Label htmlFor="startDate">Mulai Tanggal</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  className="rounded-xl h-10"
                />
                {errors.startDate && <p className="text-xs text-destructive mt-0.5">{errors.startDate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Account Selector */}
              <div className="space-y-1">
                <Label htmlFor="accountId">Dompet / Rekening</Label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-xl h-10 bg-background">
                        <SelectValue placeholder="Pilih Dompet" />
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
                {errors.accountId && <p className="text-xs text-destructive mt-0.5">{errors.accountId.message}</p>}
              </div>

              {/* Category Selector */}
              <div className="space-y-1">
                <Label htmlFor="categoryId">Kategori</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-xl h-10 bg-background">
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon || '📦'} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && <p className="text-xs text-destructive mt-0.5">{errors.categoryId.message}</p>}
              </div>
            </div>

            {/* Notification Toggle */}
            <div className="space-y-3 border-y border-border/50 py-3 my-1">
              <div className="flex items-center gap-2">
                <Controller
                  name="enableNotification"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="enableNotification"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="rounded-md"
                    />
                  )}
                />
                <Label htmlFor="enableNotification" className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Aktifkan Pengingat Tagihan
                </Label>
              </div>

              {watchedEnableNotification && (
                <div className="space-y-1.5 pl-6">
                  <Label htmlFor="notifyBeforeDays" className="text-xs">Ingatkan Sebelum Jatuh Tempo (Hari)</Label>
                  <Input
                    id="notifyBeforeDays"
                    type="number"
                    min={0}
                    max={30}
                    placeholder="1"
                    className="rounded-xl h-9 w-24"
                    {...register('notifyBeforeDays', { valueAsNumber: true })}
                  />
                  {errors.notifyBeforeDays && <p className="text-xs text-destructive">{errors.notifyBeforeDays.message}</p>}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="space-y-1">
              <Label htmlFor="note">Catatan Tambahan (Opsional)</Label>
              <Textarea
                id="note"
                placeholder="Catatan langganan..."
                rows={2}
                {...register('note')}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan Tagihan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
