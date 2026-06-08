'use client';

import { useAuth } from '@/providers/auth-provider';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Menu, Sun, Moon, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left: Menu toggle */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User menu */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.role}</p>
              </div>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Settings className="w-4 h-4" />
                Pengaturan
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <User className="w-4 h-4" />
                Profil
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
