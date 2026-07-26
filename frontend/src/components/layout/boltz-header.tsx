'use client';

import { Plus, CloudSun, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { NotificationPopover } from './notification-popover';

export function BoltzHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 transition-colors">
      {/* Brand Title / Welcome Indicator */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Selamat datang di <span className="text-blue-600 dark:text-blue-400 font-extrabold">Zayn Finance</span>
        </h2>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {/* Weather / Location Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <CloudSun className="w-4 h-4 text-amber-500" />
          <span>21° Jakarta, IDN</span>
        </div>

        {/* Action Button */}
        <Link
          href="/transactions/new"
          className="h-10 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Transaksi</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Ganti Mode Tampilan"
          className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell Popover */}
        <NotificationPopover />
      </div>
    </header>
  );
}
