'use client';

import { Search, Plus, Bell, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';

export function DesktopHeader() {
  const { user } = useAuth();

  return (
    <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-background/80 backdrop-blur-md border-b border-border/60 sticky top-0 z-30">
      {/* Search Input Bar */}
      <div className="relative w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
        <input
          type="text"
          placeholder="Cari transaksi, dompet... ⌘K"
          className="w-full h-9 pl-9 pr-4 bg-muted/40 hover:bg-muted/70 focus:bg-background border border-border/70 focus:border-indigo-500/80 rounded-xl text-xs transition-all outline-none"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/transactions/new"
          className="h-9 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Transaksi</span>
        </Link>

        <Link
          href="/ai-advisor"
          className="h-9 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold border border-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Insight</span>
        </Link>

        <button
          title="Notifikasi"
          className="relative p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-background"></span>
        </button>

        <div className="h-4 w-px bg-border/60 mx-1"></div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
