'use client';

import { useState } from 'react';
import {
  Plus,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Pencil,
  CalendarDays,
  Repeat,
  CircleDollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { formatCurrency, formatNumber } from '@/lib/utils/currency';
import {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
  useMarkComplete,
} from '@/hooks/use-reminders';
import type { Reminder, CreateReminderInput, ReminderFilter } from '@/types/reminder.types';

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Harian',
  WEEKLY: 'Mingguan',
  MONTHLY: 'Bulanan',
  YEARLY: 'Tahunan',
};

const FREQUENCY_COLORS: Record<string, string> = {
  DAILY: 'bg-blue-500/10 text-blue-600',
  WEEKLY: 'bg-purple-500/10 text-purple-600',
  MONTHLY: 'bg-emerald-500/10 text-emerald-600',
  YEARLY: 'bg-amber-500/10 text-amber-600',
};

const defaultForm: CreateReminderInput = {
  title: '',
  description: '',
  amount: undefined,
  dueDate: '',
  isRecurring: false,
  frequency: undefined,
  notifyBefore: 1,
};

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState<string>('upcoming');
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateReminderInput>({ ...defaultForm });

  const filterMap: Record<string, ReminderFilter | undefined> = {
    upcoming: 'upcoming',
    overdue: 'overdue',
    completed: 'completed',
    all: undefined,
  };

  const { data: reminders = [], isLoading } = useReminders(filterMap[activeTab]);
  const createMutation = useCreateReminder();
  const updateMutation = useUpdateReminder();
  const deleteMutation = useDeleteReminder();
  const completeMutation = useMarkComplete();

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm });
    setShowDialog(true);
  };

  const handleOpenEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title,
      description: reminder.description || '',
      amount: reminder.amount ? Number(reminder.amount) : undefined,
      dueDate: reminder.dueDate.split('T')[0],
      isRecurring: reminder.isRecurring,
      frequency: (reminder.frequency as CreateReminderInput['frequency']) || undefined,
      notifyBefore: reminder.notifyBefore,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Judul reminder harus diisi');
      return;
    }
    if (!form.dueDate) {
      toast.error('Tanggal jatuh tempo harus diisi');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: form });
        toast.success('Reminder berhasil diperbarui ✏️');
      } else {
        await createMutation.mutateAsync(form);
        toast.success('Reminder berhasil dibuat! 🔔');
      }
      setShowDialog(false);
      setForm({ ...defaultForm });
      setEditingId(null);
    } catch {
      toast.error('Gagal menyimpan reminder');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirmId);
      toast.success('Reminder berhasil dihapus 🗑️');
    } catch {
      toast.error('Gagal menghapus reminder');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeMutation.mutateAsync(id);
      toast.success('Reminder selesai! ✅');
    } catch {
      toast.error('Gagal menyelesaikan reminder');
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDueDateLabel = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return `${Math.abs(days)} hari lalu`;
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Besok';
    return `${days} hari lagi`;
  };

  const getDueDateColor = (dueDate: string, isCompleted: boolean) => {
    if (isCompleted) return 'text-muted-foreground';
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return 'text-red-500';
    if (days <= 3) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reminder</h1>
          <p className="text-muted-foreground mt-1">
            Pengingat tagihan dan pembayaran
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Reminder</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Reminder' : 'Buat Reminder Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="reminder-title">Judul *</Label>
                <Input
                  id="reminder-title"
                  placeholder="Bayar Listrik"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="reminder-desc">Deskripsi</Label>
                <Textarea
                  id="reminder-desc"
                  placeholder="Catatan tambahan..."
                  rows={2}
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Amount + Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reminder-amount">Jumlah (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      Rp
                    </span>
                    <Input
                      id="reminder-amount"
                      type="text"
                      placeholder="350000"
                      className="pl-10"
                      value={form.amount !== undefined && form.amount !== null ? formatNumber(Number(form.amount)) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                        setForm({
                          ...form,
                          amount: rawValue ? Number(rawValue) : undefined,
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-due">Jatuh Tempo *</Label>
                  <Input
                    id="reminder-due"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Recurring */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="reminder-recurring"
                    checked={form.isRecurring}
                    onCheckedChange={(checked) =>
                      setForm({
                        ...form,
                        isRecurring: Boolean(checked),
                        frequency: checked ? 'MONTHLY' : undefined,
                      })
                    }
                  />
                  <Label
                    htmlFor="reminder-recurring"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Berulang (recurring)
                  </Label>
                </div>
                {form.isRecurring && (
                  <Select
                    value={form.frequency || 'MONTHLY'}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        frequency: v as CreateReminderInput['frequency'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih frekuensi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Harian</SelectItem>
                      <SelectItem value="WEEKLY">Mingguan</SelectItem>
                      <SelectItem value="MONTHLY">Bulanan</SelectItem>
                      <SelectItem value="YEARLY">Tahunan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Notify Before */}
              <div className="space-y-2">
                <Label htmlFor="reminder-notify">Ingatkan sebelum (hari)</Label>
                <Input
                  id="reminder-notify"
                  type="number"
                  min={0}
                  max={30}
                  value={form.notifyBefore ?? 1}
                  onChange={(e) =>
                    setForm({ ...form, notifyBefore: Number(e.target.value) || 0 })
                  }
                />
              </div>

              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting
                  ? 'Menyimpan...'
                  : editingId
                    ? 'Simpan Perubahan'
                    : 'Buat Reminder'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Akan Datang</span>
            <span className="sm:hidden">Datang</span>
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Terlambat</span>
            <span className="sm:hidden">Telat</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Selesai</span>
            <span className="sm:hidden">Done</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            Semua
          </TabsTrigger>
        </TabsList>

        {['upcoming', 'overdue', 'completed', 'all'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="w-40 h-5" />
                        <Skeleton className="w-24 h-3" />
                      </div>
                      <Skeleton className="w-20 h-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    getDueDateLabel={getDueDateLabel}
                    getDueDateColor={getDueDateColor}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengingat (reminder) ini?
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

// ─── Reminder Card Component ────────────────────────────────────────────────

function ReminderCard({
  reminder,
  getDueDateLabel,
  getDueDateColor,
  onEdit,
  onDelete,
  onComplete,
}: {
  reminder: Reminder;
  getDueDateLabel: (d: string) => string;
  getDueDateColor: (d: string, completed: boolean) => string;
  onEdit: (r: Reminder) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const dueLabel = getDueDateLabel(reminder.dueDate);
  const dueColor = getDueDateColor(reminder.dueDate, reminder.isCompleted);
  const dueDate = new Date(reminder.dueDate).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 transition-all group',
        reminder.isCompleted
          ? 'border-border opacity-60'
          : dueColor === 'text-red-500'
            ? 'border-red-500/40'
            : dueColor === 'text-amber-500'
              ? 'border-amber-500/40'
              : 'border-border hover:border-primary/30',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'p-2.5 rounded-lg shrink-0',
            reminder.isCompleted
              ? 'bg-muted'
              : dueColor === 'text-red-500'
                ? 'bg-red-500/10'
                : dueColor === 'text-amber-500'
                  ? 'bg-amber-500/10'
                  : 'bg-primary/10',
          )}
        >
          {reminder.isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Bell className={cn('w-5 h-5', dueColor)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className={cn(
                  'font-semibold truncate',
                  reminder.isCompleted && 'line-through text-muted-foreground',
                )}
              >
                {reminder.title}
              </h3>
              {reminder.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {reminder.description}
                </p>
              )}
            </div>

            {/* Amount */}
            {reminder.amount && (
              <div className="flex items-center gap-1 shrink-0">
                <CircleDollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-sm">
                  {formatCurrency(Number(reminder.amount))}
                </span>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={cn('flex items-center gap-1 text-xs font-medium', dueColor)}>
              <CalendarDays className="w-3 h-3" />
              {dueDate} · {dueLabel}
            </span>

            {reminder.isRecurring && reminder.frequency && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0',
                  FREQUENCY_COLORS[reminder.frequency] || '',
                )}
              >
                <Repeat className="w-2.5 h-2.5 mr-0.5" />
                {FREQUENCY_LABELS[reminder.frequency] || reminder.frequency}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {!reminder.isCompleted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              title="Tandai selesai"
              onClick={() => onComplete(reminder.id)}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Edit"
            onClick={() => onEdit(reminder)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Hapus"
            onClick={() => onDelete(reminder.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: string }) {
  const config: Record<string, { icon: string; title: string; subtitle: string }> = {
    upcoming: {
      icon: '🎯',
      title: 'Tidak ada reminder mendatang',
      subtitle: 'Buat reminder baru untuk mengingatkan tagihan Anda',
    },
    overdue: {
      icon: '🎉',
      title: 'Tidak ada yang terlambat!',
      subtitle: 'Semua pembayaran Anda sudah tepat waktu',
    },
    completed: {
      icon: '📋',
      title: 'Belum ada yang diselesaikan',
      subtitle: 'Tandai reminder sebagai selesai ketika sudah dibayar',
    },
    all: {
      icon: '🔔',
      title: 'Belum ada reminder',
      subtitle: 'Buat reminder pertama untuk mengingat tagihan Anda',
    },
  };

  const { icon, title, subtitle } = config[tab] || config.all;

  return (
    <div className="rounded-xl border border-border bg-card p-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}
