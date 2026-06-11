'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useUpdateUser } from '@/hooks/use-users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/lib/utils/currency';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/hooks/use-accounts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { mutate: updateUser, isPending } = useUpdateUser();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [startingBalance, setStartingBalance] = useState('');

  // Wallets management state
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();

  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [deleteWalletConfirmId, setDeleteWalletConfirmId] = useState<string | null>(null);
  const [walletForm, setWalletForm] = useState({
    name: '',
    startingBalance: '',
    color: '#3b82f6',
  });

  const walletColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#64748b', // slate
  ];

  useEffect(() => {
    setMounted(true);
    if (user) {
      setName(user.name);
      setStartingBalance(user.startingBalance ? String(user.startingBalance) : '0');
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    updateUser({
      id: user.id,
      data: { name, startingBalance: Number(startingBalance) },
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Fitur ubah kata sandi akan segera hadir di pembaruan berikutnya.');
  };

  const handleOpenCreateWallet = () => {
    setEditingWalletId(null);
    setWalletForm({
      name: '',
      startingBalance: '0',
      color: '#3b82f6',
    });
    setShowWalletDialog(true);
  };

  const handleOpenEditWallet = (acc: any) => {
    setEditingWalletId(acc.id);
    setWalletForm({
      name: acc.name,
      startingBalance: String(acc.startingBalance),
      color: acc.color || '#3b82f6',
    });
    setShowWalletDialog(true);
  };

  const handleSaveWallet = async () => {
    if (!walletForm.name.trim()) {
      toast.error('Nama dompet harus diisi');
      return;
    }

    try {
      if (editingWalletId) {
        await updateAccountMutation.mutateAsync({
          id: editingWalletId,
          data: {
            name: walletForm.name,
            startingBalance: Number(walletForm.startingBalance) || 0,
            color: walletForm.color,
          },
        });
        toast.success('Dompet berhasil diperbarui ✏️');
      } else {
        await createAccountMutation.mutateAsync({
          name: walletForm.name,
          startingBalance: Number(walletForm.startingBalance) || 0,
          color: walletForm.color,
        });
        toast.success('Dompet baru berhasil dibuat! 💳');
      }
      setShowWalletDialog(false);
    } catch {
      toast.error('Gagal menyimpan dompet');
    }
  };

  const handleDeleteWallet = (id: string) => {
    setDeleteWalletConfirmId(id);
  };

  const confirmDeleteWallet = async () => {
    if (!deleteWalletConfirmId) return;
    try {
      await deleteAccountMutation.mutateAsync(deleteWalletConfirmId);
      toast.success('Dompet berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus dompet');
    } finally {
      setDeleteWalletConfirmId(null);
    }
  };

  if (!mounted || !user) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-h2 font-bold">Pengaturan & Profil</h1>
        <p className="text-muted-foreground mt-1">Kelola informasi pribadi, dompet, dan preferensi aplikasi Anda</p>
      </div>

      {/* User Header Profile */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-4 sm:p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border-4 border-background shadow-sm">
          <span className="material-symbols-outlined text-4xl">account_circle</span>
        </div>
        <div className="flex-1 min-w-0 w-full">
          <h2 className="text-xl font-bold truncate">{user.name}</h2>
          <p className="text-muted-foreground text-sm truncate">{user.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
              {user.role}
            </span>
            {user.isEmailVerified && (
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500 border border-blue-500/20">
                Terverifikasi
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 rounded-full p-1 border border-border/50 flex w-full overflow-x-auto hide-scrollbar justify-start sm:justify-center">
          <TabsTrigger value="profile" className="gap-2 rounded-full px-4 sm:px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">person</span>
            Profil
          </TabsTrigger>
          <TabsTrigger value="wallets" className="gap-2 rounded-full px-4 sm:px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Dompet Saya
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 rounded-full px-4 sm:px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">palette</span>
            Preferensi
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 rounded-full px-4 sm:px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Keamanan
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
            <h3 className="text-lg font-semibold mb-4">Informasi Pribadi</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="max-w-md bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Alamat Email</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="max-w-md bg-muted text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">Email tidak dapat diubah saat ini.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startingBalance">Saldo Awal Utama (Rp)</Label>
                <div className="relative max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                  <Input
                    id="startingBalance"
                    type="text"
                    value={startingBalance ? formatNumber(Number(startingBalance)) : ''}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      setStartingBalance(rawValue);
                    }}
                    placeholder="0"
                    className="pl-10 bg-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Saldo awal dasar sebelum ditambah pemasukan & dikurang pengeluaran manual.</p>
              </div>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 mt-4">
                {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Kelola Dompet / Akun</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Atur tempat penyimpanan uang Anda (Tunai, Bank, dll)</p>
              </div>
              <Button onClick={handleOpenCreateWallet} className="gap-2 rounded-full px-4 text-xs font-semibold">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Tambah Dompet
              </Button>
            </div>

            {loadingAccounts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted animate-pulse border border-border" />
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">account_balance_wallet</span>
                <p className="font-medium">Belum ada dompet tambahan</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Semua transaksi saat ini masuk ke saldo utama. Tambahkan dompet (seperti Bank BCA atau GoPay) untuk memisahkan pencatatan.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="relative rounded-2xl border border-border bg-background p-5 flex flex-col justify-between shadow-sm overflow-hidden"
                  >
                    {/* Color bar indicator */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2"
                      style={{ backgroundColor: acc.color || '#3b82f6' }}
                    />
                    <div className="pl-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-base">{acc.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Saldo Awal: {formatCurrency(Number(acc.startingBalance))}
                          </p>
                        </div>
                        {acc.id !== 'main' ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEditWallet(acc)}
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteWallet(acc.id)}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-1 rounded-full border border-indigo-500/20">
                            Utama
                          </span>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground font-medium">Saldo Saat Ini</p>
                        <p className="text-xl font-bold text-foreground mt-0.5">
                          {formatCurrency(acc.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
            <h3 className="text-lg font-semibold mb-4">Tampilan Aplikasi</h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                    <span className="material-symbols-outlined text-xl">light_mode</span>
                  </div>
                  <div>
                    <p className="font-medium">Mode Terang</p>
                    <p className="text-sm text-muted-foreground">Tampilan standar dengan warna cerah</p>
                  </div>
                </div>
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="rounded-full w-full sm:w-auto"
                >
                  {theme === 'light' ? 'Aktif' : 'Pilih'}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <span className="material-symbols-outlined text-xl">dark_mode</span>
                  </div>
                  <div>
                    <p className="font-medium">Mode Gelap</p>
                    <p className="text-sm text-muted-foreground">Tampilan nyaman di tempat gelap</p>
                  </div>
                </div>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="rounded-full w-full sm:w-auto"
                >
                  {theme === 'dark' ? 'Aktif' : 'Pilih'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
            <h3 className="text-lg font-semibold mb-4">Ubah Kata Sandi</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Kata Sandi Saat Ini</Label>
                <Input
                  id="current_password"
                  type="password"
                  placeholder="••••••••"
                  className="max-w-md bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Kata Sandi Baru</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="••••••••"
                  className="max-w-md bg-background"
                />
              </div>
              <Button type="submit" variant="secondary" className="rounded-full px-6 mt-4">
                Perbarui Kata Sandi
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 mt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                <span className="material-symbols-outlined text-xl">logout</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-destructive">Keluar Akun</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Sesi Anda akan diakhiri dan Anda akan dikembalikan ke halaman masuk.
                </p>
                <Button variant="destructive" onClick={logout} className="rounded-full px-6 shadow-sm">
                  Keluar Sekarang
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Wallet Form Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWalletId ? 'Edit Dompet' : 'Tambah Dompet Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="wallet-name">Nama Dompet *</Label>
              <Input
                id="wallet-name"
                placeholder="Misal: BCA Rekening, GoPay, Cash"
                value={walletForm.name}
                onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet-startingBalance">Saldo Awal (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                <Input
                  id="wallet-startingBalance"
                  type="text"
                  placeholder="0"
                  className="pl-10"
                  value={walletForm.startingBalance ? formatNumber(Number(walletForm.startingBalance)) : ''}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    setWalletForm({ ...walletForm, startingBalance: rawValue });
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Saldo awal yang sudah ada di dompet ini saat dibuat.</p>
            </div>
            <div className="space-y-2">
              <Label>Warna Dompet (Visual)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {walletColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setWalletForm({ ...walletForm, color })}
                    className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: color,
                      borderColor: walletForm.color === color ? 'white' : 'transparent',
                      boxShadow: walletForm.color === color ? '0 0 0 2px #3b82f6' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
            <Button
              className="w-full rounded-full"
              onClick={handleSaveWallet}
              disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
            >
              {createAccountMutation.isPending || updateAccountMutation.isPending ? 'Menyimpan...' : 'Simpan Dompet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Wallet Confirmation Dialog */}
      <Dialog open={!!deleteWalletConfirmId} onOpenChange={(open) => !open && setDeleteWalletConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Dompet</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus dompet ini? Semua riwayat transaksi pada dompet ini juga akan terhapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteWalletConfirmId(null)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDeleteWallet} disabled={deleteAccountMutation.isPending}>
              {deleteAccountMutation.isPending ? 'Menghapus...' : 'Hapus Dompet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
