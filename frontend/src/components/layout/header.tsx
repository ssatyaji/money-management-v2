'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Menu, Sun, Moon, LogOut, User, Settings, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { cn } from '@/lib/utils';
import { LogoutDialog } from '@/components/shared/logout-dialog';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const [greeting, setGreeting] = useState('Selamat Datang');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Get the hour in the local browser timezone (e.g. Bangkok/Hanoi/Jakarta)
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      setGreeting('Selamat Pagi');
    } else if (hour >= 11 && hour < 15) {
      setGreeting('Selamat Siang');
    } else if (hour >= 15 && hour < 18) {
      setGreeting('Selamat Sore');
    } else {
      setGreeting('Selamat Malam');
    }
  }, []);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 h-16 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
      {/* Left section: Menu toggle (lg only) + Avatar & Greeting */}
      <div className="flex items-center gap-3">
        {/* Desktop Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors hidden lg:block"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center text-primary border border-border/50">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-xl">account_circle</span>
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="font-body-sm text-xs text-muted-foreground">{greeting}</span>
          <span className="font-h1 text-lg font-bold text-foreground tracking-tight hidden sm:block">{user?.name || 'User'}</span>
          <span className="font-h1 text-lg font-bold text-foreground tracking-tight sm:hidden">{user?.name?.split(' ')[0] || 'User'}</span>
        </div>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications toggle */}
        <button
          disabled={isLoading}
          onClick={isSubscribed ? unsubscribe : subscribe}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full transition-colors active:scale-95 duration-150",
            isSubscribed ? "text-primary" : "text-foreground hover:bg-muted"
          )}
          title={isSubscribed ? "Matikan Notifikasi" : "Nyalakan Notifikasi"}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${isSubscribed ? 1 : 0}` }}>
            {isSubscribed ? 'notifications_active' : 'notifications'}
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors active:scale-95 duration-150"
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* User menu dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors active:scale-95 duration-150 outline-none">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border border-border rounded-lg shadow-[0px_4px_12px_rgba(26,43,60,0.1)] p-1 z-50">
            {/* Refresh — only visible on mobile (PWA on iPhone doesn't support pull-to-refresh) */}
            <DropdownMenuItem
              onClick={() => window.location.reload()}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer rounded-md outline-none lg:hidden"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/settings?tab=profile')}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer rounded-md outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/settings?tab=wallets')}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer rounded-md outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              Dompet Saya
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/settings?tab=security')}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer rounded-md outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">lock</span>
              Keamanan
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border my-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors cursor-pointer rounded-md outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <LogoutDialog
      open={showLogoutDialog}
      onOpenChange={setShowLogoutDialog}
      onConfirm={confirmLogout}
      isLoading={isLoggingOut}
    />
  </>
  );
}
