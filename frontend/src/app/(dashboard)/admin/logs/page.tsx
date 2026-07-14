'use client';

import { useState } from 'react';
import { useActivityLogs } from '@/hooks/use-admin';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Terminal, ArrowRightLeft, User, Sparkles, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AdminLogsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('ALL');
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useActivityLogs({
    page,
    limit: 10,
    search,
    action: action === 'ALL' ? undefined : action,
  });

  const getActionBadge = (actionName: string) => {
    switch (actionName) {
      case 'USER_LOGIN':
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/10 gap-1 flex w-fit items-center text-[11px]">
            <User className="w-3 h-3" /> Login
          </Badge>
        );
      case 'USER_REGISTER':
        return (
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 gap-1 flex w-fit items-center text-[11px]">
            <User className="w-3 h-3" /> Register
          </Badge>
        );
      case 'OCR_PROCESS':
        return (
          <Badge variant="outline" className="text-purple-500 border-purple-500/20 bg-purple-500/10 gap-1 flex w-fit items-center text-[11px]">
            <Sparkles className="w-3 h-3" /> OCR Process
          </Badge>
        );
      case 'CREATE_TRANSACTION':
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10 gap-1 flex w-fit items-center text-[11px]">
            <ArrowRightLeft className="w-3 h-3" /> Create Tx
          </Badge>
        );
      case 'DELETE_TRANSACTION':
        return (
          <Badge variant="outline" className="text-rose-500 border-rose-500/20 bg-rose-500/10 gap-1 flex w-fit items-center text-[11px]">
            <AlertCircle className="w-3 h-3" /> Delete Tx
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground border-muted/20 bg-muted/10 gap-1 flex w-fit items-center text-[11px]">
            {actionName}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Terminal className="h-8 w-8 text-primary" />
          Log Aktivitas
        </h1>
        <p className="text-muted-foreground mt-1">
          Pantau riwayat kegiatan dan penggunaan fitur oleh pengguna platform
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari deskripsi log, email, atau nama..."
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
            value={action}
            onValueChange={(val) => {
              setAction(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipe Aktivitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Aktivitas</SelectItem>
              <SelectItem value="USER_LOGIN">Login</SelectItem>
              <SelectItem value="USER_REGISTER">Register</SelectItem>
              <SelectItem value="OCR_PROCESS">Proses OCR</SelectItem>
              <SelectItem value="CREATE_TRANSACTION">Buat Transaksi</SelectItem>
              <SelectItem value="DELETE_TRANSACTION">Hapus Transaksi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile View (Card List) */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Memuat data log...</div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Tidak ada aktivitas ditemukan.</div>
        ) : (
          data.data.map((log) => (
            <div key={log.id} className="rounded-2xl border border-border bg-card p-5 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{log.user?.name || 'Sistem / Tamu'}</span>
                  <span className="text-xs text-muted-foreground">{log.user?.email || '-'}</span>
                </div>
                {getActionBadge(log.action)}
              </div>
              <p className="text-sm text-foreground bg-accent/30 p-3 rounded-xl border border-border/30">
                {log.details}
              </p>
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                <span>IP: {log.ipAddress || 'Internal'}</span>
                <span>{format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: id })}</span>
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
              <TableHead className="w-[180px]">Waktu</TableHead>
              <TableHead className="w-[200px]">Pengguna</TableHead>
              <TableHead className="w-[150px]">Aktivitas</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="w-[120px]">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Memuat data log...
                </TableCell>
              </TableRow>
            ) : !data?.data || data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Tidak ada aktivitas ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: id })}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{log.user.name}</span>
                        <span className="text-xs text-muted-foreground">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">Sistem / Tamu</span>
                    )}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="text-sm font-normal text-foreground max-w-md truncate" title={log.details || ''}>
                    {log.details || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">
                    {log.ipAddress || 'Internal'}
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
    </div>
  );
}
