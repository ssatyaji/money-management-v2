'use client';

import { useState } from 'react';
import { usePlatformExpenses, useDeletePlatformExpense, useAdminStats } from '@/hooks/use-admin';
import { PlatformExpenseDialog } from '@/components/admin/platform-expense-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Receipt, Plus, Trash2, Server, Key, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AdminExpensesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: stats } = useAdminStats();
  const { data, isLoading } = usePlatformExpenses({
    page,
    limit: 10,
    search,
    category: category === 'ALL' ? undefined : category,
  });

  const { mutate: deleteExpense, isPending: isDeleting } = useDeletePlatformExpense();

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'HOSTING':
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/10 gap-1 flex w-fit items-center text-[11px]">
            <Server className="w-3 h-3" /> Hosting / Server
          </Badge>
        );
      case 'API_COST':
        return (
          <Badge variant="outline" className="text-purple-500 border-purple-500/20 bg-purple-500/10 gap-1 flex w-fit items-center text-[11px]">
            <Key className="w-3 h-3" /> API (OCR, AI)
          </Badge>
        );
      case 'MARKETING':
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10 gap-1 flex w-fit items-center text-[11px]">
            <DollarSign className="w-3 h-3" /> Marketing
          </Badge>
        );
      case 'SALARY':
        return (
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 gap-1 flex w-fit items-center text-[11px]">
            <Wallet className="w-3 h-3" /> Gaji
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground border-muted/20 bg-muted/10 gap-1 flex w-fit items-center text-[11px]">
            Lainnya
          </Badge>
        );
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    deleteExpense(deleteConfirmId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            Biaya Operasional Platform
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola pengeluaran operasional dan biaya infrastruktur sistem
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Tambah Biaya
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran Platform</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {formatCurrency(stats?.totalPlatformExpense || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Akumulasi seluruh pengeluaran operasional</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                data?.data?.reduce((acc, curr) => {
                  const currDate = new Date(curr.date);
                  const now = new Date();
                  if (currDate.getMonth() === now.getMonth() && currDate.getFullYear() === now.getFullYear()) {
                    return acc + Number(curr.amount);
                  }
                  return acc;
                }, 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Bulan berjalan</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Efisiensi Profitabilitas</CardTitle>
            < DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {stats ? formatCurrency((stats.totalIncome || 0) - (stats.totalPlatformExpense || 0)) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Pemasukan User - Pengeluaran Platform</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari biaya..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select
            value={category}
            onValueChange={(val) => {
              setCategory(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              <SelectItem value="HOSTING">Hosting / Server</SelectItem>
              <SelectItem value="API_COST">Layanan API (OCR, AI)</SelectItem>
              <SelectItem value="MARKETING">Pemasaran / Iklan</SelectItem>
              <SelectItem value="SALARY">Gaji</SelectItem>
              <SelectItem value="OTHERS">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile View (Card List) */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Memuat data biaya...</div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Tidak ada data biaya operasional.</div>
        ) : (
          data.data.map((expense) => (
            <div key={expense.id} className="rounded-2xl border border-border bg-card p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{expense.description}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(expense.date), 'dd MMM yyyy', { locale: id })}</span>
                </div>
                {getCategoryBadge(expense.category)}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-rose-500 font-bold text-base">
                  -{formatCurrency(Number(expense.amount))}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-full"
                  onClick={() => setDeleteConfirmId(expense.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden lg:block rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Tanggal</TableHead>
              <TableHead>Nama Pengeluaran</TableHead>
              <TableHead className="w-[180px]">Kategori</TableHead>
              <TableHead className="w-[180px] text-right">Nominal</TableHead>
              <TableHead className="w-[100px] text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Memuat data biaya...
                </TableCell>
              </TableRow>
            ) : !data?.data || data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Tidak ada data biaya operasional ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    {format(new Date(expense.date), 'dd MMM yyyy', { locale: id })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{expense.description}</span>
                      {expense.notes && <span className="text-xs text-muted-foreground mt-0.5">{expense.notes}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(expense.category)}</TableCell>
                  <TableCell className="text-right text-rose-500 font-bold text-sm">
                    -{formatCurrency(Number(expense.amount))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-full"
                      onClick={() => setDeleteConfirmId(expense.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan halaman {data.meta.page} dari {data.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <PlatformExpenseDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Biaya</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data pengeluaran platform ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Menghapus...' : 'Hapus Biaya'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
