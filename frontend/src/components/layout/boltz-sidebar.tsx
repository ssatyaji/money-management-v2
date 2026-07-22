'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  HandCoins,
  TrendingUp,
  Sparkles,
  BarChart3,
  CalendarDays,
  ScanLine,
  Settings,
  Shield,
  Users,
  Terminal,
  LogOut,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  { label: 'Manajemen Pengguna', href: '/admin/users', icon: Users, exact: false },
  { label: 'Log Aktivitas', href: '/admin/logs', icon: Terminal, exact: false },
];

export function BoltzSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 h-screen border-r border-slate-200/80 dark:border-slate-800/80 fixed left-0 top-0 bottom-0 z-40 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
          <Zap className="w-5 h-5 fill-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight leading-none">
            Zayn Finance
          </h1>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wider uppercase mt-1">
            Personal Finance
          </p>
        </div>
      </div>

      {/* User Profile Snippet */}
      <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="truncate flex-1">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50',
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-transform group-hover:scale-110',
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400',
                  )}
                />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}

        {/* Admin Section */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-3" />
            {adminItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-transform group-hover:scale-110',
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400',
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 flex-shrink-0">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
