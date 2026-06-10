'use client';

import { useAuth } from '@/providers/auth-provider';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Menu, Sun, Moon, LogOut, User, Settings, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
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

        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-primary font-bold">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        
        <div className="flex flex-col">
          <span className="font-body-sm text-xs text-muted-foreground">Good Morning</span>
          <span className="font-h1 text-lg font-bold text-foreground tracking-tight hidden sm:block">Steward Finance</span>
          <span className="font-h1 text-lg font-bold text-foreground tracking-tight sm:hidden">{user?.name?.split(' ')[0] || 'User'}</span>
        </div>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications toggle */}
        {isSupported && (
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
        )}

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
        <div className="relative group">
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors active:scale-95 duration-150">
             <span className="material-symbols-outlined">more_vert</span>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-card border border-border rounded-lg shadow-[0px_4px_12px_rgba(26,43,60,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Pengaturan
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
              Profil
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Keluar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
