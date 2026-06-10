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

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { mutate: updateUser, isPending } = useUpdateUser();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    setMounted(true);
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    updateUser({ id: user.id, data: { name } });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Fitur ubah kata sandi akan segera hadir di pembaruan berikutnya.');
  };

  if (!mounted || !user) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-h2 font-bold">Pengaturan & Profil</h1>
        <p className="text-muted-foreground mt-1">Kelola informasi pribadi dan preferensi aplikasi Anda</p>
      </div>

      {/* User Header Profile */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border-4 border-background shadow-sm">
          <span className="material-symbols-outlined text-4xl">account_circle</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
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
        <TabsList className="bg-muted/50 rounded-full p-1 border border-border/50">
          <TabsTrigger value="profile" className="gap-2 rounded-full px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <span className="material-symbols-outlined text-[18px]">person</span>
            Profil
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 rounded-full px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <span className="material-symbols-outlined text-[18px]">palette</span>
            Preferensi
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 rounded-full px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Keamanan
          </TabsTrigger>
        </TabsList>

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
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 mt-4">
                {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
            <h3 className="text-lg font-semibold mb-4">Tampilan Aplikasi</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
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
                  className="rounded-full"
                >
                  {theme === 'light' ? 'Aktif' : 'Pilih'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <span className="material-symbols-outlined text-xl">dark_mode</span>
                  </div>
                  <div>
                    <p className="font-medium">Mode Gelap</p>
                    <p className="text-sm text-muted-foreground">Tampilan nyaman untuk mata di tempat gelap</p>
                  </div>
                </div>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  onClick={() => setTheme('dark')}
                  className="rounded-full"
                >
                  {theme === 'dark' ? 'Aktif' : 'Pilih'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

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
    </div>
  );
}
