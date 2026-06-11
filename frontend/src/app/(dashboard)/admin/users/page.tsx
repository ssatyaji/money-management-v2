'use client';

import { useState } from 'react';
import { useUsers, useDeleteUser } from '@/hooks/use-users';
import { User } from '@/lib/api/users.api';
import { UserDialog } from '@/components/admin/user-dialog';
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
import { Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers({ page, limit: 10, search });
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    setDeleteConfirmId(userId);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    deleteUser(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-1">Kelola data dan hak akses pengguna</p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari email atau nama..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Mobile View (Card List) */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Memuat data pengguna...</div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Tidak ada pengguna ditemukan.</div>
        ) : (
          data.data.map((user) => (
            <div key={user.id} className="rounded-2xl border border-border bg-card p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                      <span className="sr-only">Open menu</span>
                      <span className="material-symbols-outlined">more_vert</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(user)}>
                      <span className="material-symbols-outlined mr-2 text-[18px]">edit</span>
                      Edit Pengguna
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(user.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <span className="material-symbols-outlined mr-2 text-[18px]">delete</span>
                      Hapus Pengguna
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex gap-2">
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0">
                    {user.role}
                  </Badge>
                  {user.isVerified ? (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 text-[10px] px-2 py-0">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10 text-[10px] px-2 py-0">
                      Unverified
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengguna</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bergabung Pada</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Memuat data pengguna...
                </TableCell>
              </TableRow>
            ) : !data?.data || data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Tidak ada pengguna ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isVerified ? (
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10">
                        Unverified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                          <span className="sr-only">Open menu</span>
                          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <span className="material-symbols-outlined mr-2 text-[18px]">edit</span>
                          Edit Pengguna
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <span className="material-symbols-outlined mr-2 text-[18px]">delete</span>
                          Hapus Pengguna
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              onClick={() => setPage(p => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <UserDialog
        user={selectedUser}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna ini? Semua data terkait (transaksi, budget, dsb) akan ikut terhapus permanen!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Menghapus...' : 'Hapus Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
