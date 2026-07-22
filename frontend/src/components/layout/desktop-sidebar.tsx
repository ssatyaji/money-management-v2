'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  HandCoins,
  TrendingUp,
  FileText,
  Bot,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Anggaran', href: '/budgets', icon: PieChart },
  { name: 'Target Tabungan', href: '/goals', icon: Target },
  { name: 'Utang & Piutang', href: '/debts', icon: HandCoins },
  { name: 'Investasi', href: '/investments', icon: TrendingUp },
  { name: 'Laporan', href: '/reports/monthly', icon: FileText },
  { name: 'AI Advisor', href: '/ai-advisor', icon: Bot },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0f172a] text-slate-200 h-screen border-r border-slate-800/80 fixed left-0 top-0 bottom-0 z-40">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/60 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black text-xl">
          Z
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-tight leading-none">
            Zayn Finance
          </h1>
          <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase mt-0.5">
            Personal Finance
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400',
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Need Help Card */}
      <div className="px-3 py-2 flex-shrink-0">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Butuh Bantuan?</p>
              <p className="text-[10px] text-slate-400">Tanya AI Advisor</p>
            </div>
          </div>
          <Link
            href="/ai-advisor"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
          >
            →
          </Link>
        </div>
      </div>

      {/* User Profile Pill */}
      <div className="p-4 border-t border-slate-800/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-200 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          title="Logout"
          className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
