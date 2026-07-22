# Boltz-Style Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp the desktop layout (`lg:` breakpoint and up) and components of `/dashboard` in Zayn Finance to match the Boltz UI aesthetic (clean off-white background canvas, floating white stat cards with circular colored icons, arc concentric category chart, double smooth line chart, 4 colorful credit-card styled wallet cards, recent transactions table with period tabs), supporting both Light and Dark modes.

**Architecture:** Next.js App Router component decomposition into clean, reusable modular components under `frontend/src/components/dashboard/`, updating the responsive sidebar/header and layout containers.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, Recharts, Lucide Icons, TypeScript.

## Global Constraints

- Full support for both **Light Mode** (`bg-[#f8fafc]`, `bg-white`, `border-slate-200/70`) and **Dark Mode** (`dark:bg-[#0b0f17]`, `dark:bg-[#151c2c]`, `dark:border-slate-800/80`).
- Use `Inter` / `Manrope` typography with clean font weights (`font-bold tracking-tight`, `font-extrabold`).
- Mobile responsiveness (`< lg:` breakpoint retains mobile navigation & drawer).
- No hardcoded currency math; consume existing `formatCurrency`, `useTransactionSummary`, `useAccounts`, `useCategoryBreakdown`, `useDailyTrend`, `useRecentTransactions` hooks.

---

### Task 1: Create Adaptive Light/Dark Boltz Sidebar Component

**Files:**
- Create: `frontend/src/components/layout/boltz-sidebar.tsx`
- Modify: `frontend/src/app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `useAuth()` hook for user profile.
- Produces: `<BoltzSidebar />` component for `lg:` screens.

- [ ] **Step 1: Create `frontend/src/components/layout/boltz-sidebar.tsx`**

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
  Zap,
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
                'flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium transition-all duration-200 group',
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
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
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
```

- [ ] **Step 2: Commit Task 1**

```bash
git add frontend/src/components/layout/boltz-sidebar.tsx
git commit -m "feat(ui): add adaptive BoltzSidebar component"
```

---

### Task 2: Create Boltz Top Header Bar Component

**Files:**
- Create: `frontend/src/components/layout/boltz-header.tsx`
- Modify: `frontend/src/app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: Theme provider and user search input.
- Produces: `<BoltzHeader />` sticky header bar.

- [ ] **Step 1: Create `frontend/src/components/layout/boltz-header.tsx`**

```tsx
'use client';

import { Search, Plus, Bell, CloudSun, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/providers/theme-provider';

export function BoltzHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 transition-colors">
      {/* Search Input Bar */}
      <div className="relative w-80">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari transaksi, dompet... ⌘K"
          className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 focus:border-blue-500 rounded-2xl text-xs transition-all outline-none"
        />
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {/* Weather / Location Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <CloudSun className="w-4 h-4 text-amber-500" />
          <span>21° Jakarta, IDN</span>
        </div>

        {/* Filter Periode Action Button */}
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

        {/* Notification Bell */}
        <button
          title="Notifikasi"
          className="relative p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Update `frontend/src/app/(dashboard)/layout.tsx` to include `BoltzSidebar` and `BoltzHeader`**

- [ ] **Step 3: Commit Task 2**

```bash
git add frontend/src/components/layout/boltz-header.tsx frontend/src/app/\(dashboard\)/layout.tsx
git commit -m "feat(ui): add BoltzHeader component and layout integration"
```

---

### Task 3: Create Boltz Stat Cards & Wallet Cards Components

**Files:**
- Create: `frontend/src/components/dashboard/boltz-stat-cards.tsx`
- Create: `frontend/src/components/dashboard/boltz-wallet-cards.tsx`

**Interfaces:**
- Consumes: Account list and summary metrics.
- Produces: `<BoltzStatCards />` and `<BoltzWalletCards />`.

- [ ] **Step 1: Create `frontend/src/components/dashboard/boltz-stat-cards.tsx`**

```tsx
'use client';

import { TrendingUp, ArrowDownRight, Wallet, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface BoltzStatCardsProps {
  totalBalance: number;
  income: number;
  expense: number;
  savings: number;
  showBalance: boolean;
}

export function BoltzStatCards({
  totalBalance,
  income,
  expense,
  savings,
  showBalance,
}: BoltzStatCardsProps) {
  const cards = [
    {
      title: 'Total Saldo',
      amount: totalBalance,
      trend: '+45% minggu ini',
      icon: Wallet,
      iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Pemasukan',
      amount: income,
      trend: '+12.5% bln ini',
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Pengeluaran',
      amount: expense,
      trend: '-8.2% bln ini',
      icon: ArrowDownRight,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Tabungan & Investasi',
      amount: savings,
      trend: '+15.8% minggu ini',
      icon: PiggyBank,
      iconBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {showBalance ? formatCurrency(card.amount) : 'Rp ••••••'}
              </h3>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>📈</span>
                <span>{card.trend}</span>
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/dashboard/boltz-wallet-cards.tsx`**

```tsx
'use client';

import { formatCurrency } from '@/lib/utils/currency';
import { Account } from '@/lib/api/accounts.api';

interface BoltzWalletCardsProps {
  accounts: Account[];
  showBalance: boolean;
}

const gradients = [
  'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/10',
  'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/10',
  'bg-gradient-to-tr from-purple-600 to-indigo-700 text-white shadow-purple-500/10',
  'bg-gradient-to-tr from-orange-500 to-amber-600 text-white shadow-orange-500/10',
];

export function BoltzWalletCards({ accounts, showBalance }: BoltzWalletCardsProps) {
  const displayAccounts = accounts.slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Kartu Dompet & Rekening
        </h3>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {accounts.length} Akun Terhubung
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {displayAccounts.map((acc, idx) => {
          const grad = gradients[idx % gradients.length];
          return (
            <div
              key={acc.id}
              className={`p-5 rounded-2xl ${grad} shadow-lg relative overflow-hidden flex flex-col justify-between h-44 transition-transform hover:-translate-y-1`}
            >
              {/* Top Card Info */}
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {acc.name}
                </span>
                <span className="text-lg opacity-80 font-mono">💳</span>
              </div>

              {/* Balance */}
              <div className="z-10 my-2">
                <p className="text-[10px] uppercase tracking-widest opacity-75 font-semibold">
                  Saldo Akun
                </p>
                <h4 className="text-2xl font-extrabold tracking-tight">
                  {showBalance ? formatCurrency(Number(acc.balance)) : 'Rp ••••••'}
                </h4>
              </div>

              {/* Bottom Card Holder */}
              <div className="flex items-center justify-between text-[11px] opacity-90 z-10 pt-2 border-t border-white/15">
                <div>
                  <p className="text-[9px] uppercase opacity-75 font-medium">Tipe Dompet</p>
                  <p className="font-semibold">{acc.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase opacity-75 font-medium">Status</p>
                  <p className="font-semibold">Aktif</p>
                </div>
              </div>

              {/* Decorative wave circles */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
              <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-black/10 blur-xl"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit Task 3**

```bash
git add frontend/src/components/dashboard/boltz-stat-cards.tsx frontend/src/components/dashboard/boltz-wallet-cards.tsx
git commit -m "feat(ui): add BoltzStatCards and BoltzWalletCards components"
```

---

### Task 4: Assemble Page & Run Build Verification

**Files:**
- Modify: `frontend/src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Assemble full Boltz layout in `/dashboard/page.tsx` using `BoltzStatCards`, `BoltzWalletCards`, Recharts line & category arc charts, and Recent Transactions table**
- [ ] **Step 2: Execute `npm run build` in `frontend`**
  Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit Task 4**

```bash
git add frontend/src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat(dashboard): assemble full Boltz-style dashboard revamp"
```

---
