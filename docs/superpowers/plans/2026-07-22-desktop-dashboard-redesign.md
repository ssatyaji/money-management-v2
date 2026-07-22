# Desktop Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the desktop layout (`lg:` breakpoint and up) of `/dashboard` in Zayn Finance to adopt the ZARO SaaS dashboard aesthetic featuring a dark navy sidebar, sticky search header bar, 4 top KPI stat cards with sparklines, 2 main charts, and 3 bottom section widgets.

**Architecture:** Next.js App Router component decomposition into clean, reusable modular components under `frontend/src/components/dashboard/`, preserving existing responsive mobile navigation and Recharts data hooks.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, Recharts, Lucide Icons, TypeScript.

## Global Constraints

- Preserve mobile responsiveness (`< lg:` breakpoint retains existing bottom navigation & mobile drawer).
- Use curated HSL & Tailwind color palettes (`#0f172a` dark navy for sidebar, `#6366f1` indigo, `#10b981` emerald).
- No hardcoded currency math; use existing `formatCurrency` and `useTransactionSummary` hooks.

---

### Task 1: Create Desktop Dark Navy Sidebar Component

**Files:**
- Create: `frontend/src/components/layout/desktop-sidebar.tsx`
- Modify: `frontend/src/app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `useAuth()` hook for user info.
- Produces: `<DesktopSidebar />` component for `lg:` screens.

- [ ] **Step 1: Create `frontend/src/components/layout/desktop-sidebar.tsx`**

```tsx
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
    <aside className="hidden lg:flex flex-col w-64 bg-[#0f172a] text-slate-200 min-h-screen border-r border-slate-800/80 fixed left-0 top-0 bottom-0 z-40">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black text-xl">
          Z
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-tight leading-none">
            Zayn Finance
          </h1>
          <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase mt-0.5">
            SaaS Platform
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
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
              <Icon className={cn('w-4 h-4 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Need Help Card */}
      <div className="px-4 py-3">
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Butuh Bantuan?</p>
              <p className="text-[10px] text-slate-400">Tanya AI Advisor</p>
            </div>
          </div>
          <Link href="/ai-advisor" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
            →
          </Link>
        </div>
      </div>

      {/* User Profile Pill */}
      <div className="p-4 border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          title="Logout"
          className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Add `<DesktopSidebar />` to `frontend/src/app/(dashboard)/layout.tsx`**

Update `layout.tsx` to include `pl-0 lg:pl-64` on desktop main container.

- [ ] **Step 3: Commit Task 1**

```bash
git add frontend/src/components/layout/desktop-sidebar.tsx frontend/src/app/(dashboard)/layout.tsx
git commit -m "feat(ui): add desktop dark navy sidebar component"
```

---

### Task 2: Create Top Desktop Header Bar Component

**Files:**
- Create: `frontend/src/components/layout/desktop-header.tsx`
- Modify: `frontend/src/app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: User info and search command triggers.
- Produces: `<DesktopHeader />` sticky header bar.

- [ ] **Step 1: Create `frontend/src/components/layout/desktop-header.tsx`**

```tsx
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
          className="h-9 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Transaksi</span>
        </Link>

        <Link
          href="/ai-advisor"
          className="h-9 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold border border-indigo-500/20 flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Insight</span>
        </Link>

        <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-colors">
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
```

- [ ] **Step 2: Commit Task 2**

```bash
git add frontend/src/components/layout/desktop-header.tsx
git commit -m "feat(ui): add desktop header bar component"
```

---

### Task 3: Assemble ZARO Style Dashboard Page Grid

**Files:**
- Modify: `frontend/src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Refactor `/dashboard/page.tsx` layout into 4 Top KPI Stat Cards, 2 Main Side-by-Side Charts, and 3 Bottom Widgets**

In `page.tsx`, structure desktop view grid using Tailwind CSS grid (`lg:grid-cols-4`, `lg:grid-cols-12` for charts and bottom widgets).

- [ ] **Step 2: Test Next.js build clean**

Run: `cd frontend && npm run build`  
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit Task 3**

```bash
git add frontend/src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat(dashboard): redesign desktop dashboard layout to ZARO SaaS pattern"
```

---
