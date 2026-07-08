'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  BarChart3,
  CalendarDays,
  Bell,
  ScanLine,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Target,
  HandCoins,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Transaksi', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Budget', href: '/budgets', icon: PiggyBank },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Hutang/Piutang', href: '/debts', icon: HandCoins },
  { label: 'Investasi', href: '/investments', icon: TrendingUp },
  { label: 'AI Advisor', href: '/ai-advisor', icon: Sparkles },
  { label: 'Laporan Bulanan', href: '/reports/monthly', icon: BarChart3 },
  { label: 'Laporan Tahunan', href: '/reports/yearly', icon: CalendarDays },
  { label: 'Scan & Import', href: '/scan/receipt', icon: ScanLine },
  { label: 'Pengaturan', href: '/settings', icon: Settings },
];

const adminItems = [
  { label: 'Admin Panel', href: '/admin', icon: Shield, exact: true },
  { label: 'Manajemen Pengguna', href: '/admin/users', icon: Shield, exact: false },
];

export function AppSidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 hidden lg:block',
        isOpen ? 'w-64' : 'w-20',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          {isOpen && (
            <span className="text-lg font-bold gradient-text whitespace-nowrap">
              MoneyApp
            </span>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 p-3 mt-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                !isOpen && 'justify-center px-0',
              )}
              title={!isOpen ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Admin section */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="h-px bg-border my-3" />
            {adminItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    !isOpen && 'justify-center px-0',
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-accent transition-colors"
      >
        {isOpen ? (
          <ChevronLeft className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
