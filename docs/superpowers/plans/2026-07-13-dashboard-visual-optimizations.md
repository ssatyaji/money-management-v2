# Zayn Finance Dashboard Visual Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement modern, premium visual optimizations on the Zayn Finance dashboard, including cursor-tracking radial glow cards (dark mode only), a semi-circular savings goal gauge, and deterministic wallet balance sparklines.

**Architecture:** 
1. Create a React UI wrapper component `GlowCard` that tracks mouse movements to dynamically update CSS variables for a radial gradient hover effect (active in dark mode only).
2. Rewrite the horizontal wallet/accounts rendering in `dashboard/page.tsx` to include an SVG-based sparkline generated deterministically from balance stats.
3. Modify the Saving Goals summary display to feature an SVG path-based semi-circular progress indicator that animates smoothly.

**Tech Stack:** Next.js 16.2.7, React 19.2.4, Tailwind CSS v4, Lucide Icons, SVG

## Global Constraints
- Standard formatting and linting: Follow Prettier/ESLint configs.
- No external libraries: Do not add Framer Motion or extra graphing libraries. Rely on native Tailwind v4 classes and SVG.
- Ambient glow must only be visible in dark mode.

---

### Task 1: Create the Reusable GlowCard Component

**Files:**
- Create: `frontend/src/components/ui/glow-card.tsx`

**Interfaces:**
- Produces: `GlowCard` component rendering as a styled div container with client-side mouse move event handling.

- [ ] **Step 1: Create the new UI component**
  Write the React code for `GlowCard` under `frontend/src/components/ui/glow-card.tsx`:
  ```tsx
  'use client';

  import * as React from 'react';
  import { cn } from '@/lib/utils';

  export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {}

  export const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
    ({ className, children, ...props }, ref) => {
      const cardRef = React.useRef<HTMLDivElement>(null);
      React.useImperativeHandle(ref, () => cardRef.current!);

      const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
      };

      return (
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          className={cn(
            'group relative overflow-hidden rounded-[24px] border border-border/80 bg-card/65 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5',
            'before:absolute before:inset-0 before:pointer-events-none before:opacity-0 before:transition-opacity before:duration-500',
            'dark:hover:before:opacity-100',
            'dark:before:bg-[radial-gradient(350px_circle_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(16,185,129,0.06),transparent_80%)]',
            className
          )}
          {...props}
        >
          {children}
        </div>
      );
    }
  );

  GlowCard.displayName = 'GlowCard';
  ```

- [ ] **Step 2: Verify code builds correctly**
  Run: `npm run build` or `npx tsc --noEmit` inside `frontend` directory to ensure type safety.
  Expected: Successful completion with no errors.

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/components/ui/glow-card.tsx
  git commit -m "feat: add reusable GlowCard component with cursor-tracking dark glow"
  ```

---

### Task 2: Implement Sparklines on Wallet Cards

**Files:**
- Modify: `frontend/src/app/(dashboard)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `GlowCard` component from `@/components/ui/glow-card`
- Produces: Integrated wallet sparklines and GlowCard wrappers for the Wallet scroll list in `DashboardPage`.

- [ ] **Step 1: Add deterministic sparkline generator function**
  Add this helper function above the `DashboardPage` component in `frontend/src/app/(dashboard)/dashboard/page.tsx`:
  ```tsx
  const generateSparklinePoints = (id: string, balance: number, startingBalance: number) => {
    const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const points = [];
    const count = 8;
    const range = Math.max(Math.abs(balance - startingBalance), 100000);
    
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const sineVal = Math.sin(progress * Math.PI * 1.5 + (seed % 10)) * 0.3;
      const noiseVal = Math.cos(progress * Math.PI * 3.5 + (seed % 7)) * 0.1;
      const base = startingBalance + (balance - startingBalance) * progress;
      const variation = range * (sineVal + noiseVal) * (1 - progress * 0.6);
      points.push(base + variation);
    }
    
    const min = Math.min(...points);
    const max = Math.max(...points);
    const divisor = (max - min) === 0 ? 1 : (max - min);
    
    return points.map((p, idx) => ({
      x: (idx / (count - 1)) * 100,
      y: 35 - ((p - min) / divisor) * 25 - 5 // viewBox height is 40
    }));
  };
  ```

- [ ] **Step 2: Update the horizontal accounts list**
  Import `GlowCard` at the top of `frontend/src/app/(dashboard)/dashboard/page.tsx`:
  ```tsx
  import { GlowCard } from '@/components/ui/glow-card';
  ```
  Modify the rendering of `accounts.map((acc)` (lines 181-198) in `frontend/src/app/(dashboard)/dashboard/page.tsx`:
  ```tsx
  {accounts.map((acc) => {
    const sparkPoints = generateSparklinePoints(acc.id, Number(acc.balance) || 0, Number(acc.startingBalance) || 0);
    const pathData = `M ${sparkPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const areaData = `${pathData} L 100 40 L 0 40 Z`;

    return (
      <GlowCard
        key={acc.id}
        className="min-w-[180px] sm:min-w-[220px] p-4 flex flex-col justify-between relative overflow-hidden shrink-0"
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 z-10"
          style={{ backgroundColor: acc.color || '#3b82f6' }}
        />
        <div className="pl-1.5 space-y-1 z-10 relative">
          <p className="text-xs text-muted-foreground truncate font-medium">{acc.name}</p>
          <p className="text-lg font-bold text-foreground truncate">
            {showBalance ? formatCurrency(acc.balance) : 'Rp ••••••'}
          </p>
        </div>

        {/* Deterministic Sparkline */}
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-60 pointer-events-none z-0">
          <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`grad-${acc.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={acc.color || '#3b82f6'} stopOpacity="0.15" />
                <stop offset="100%" stopColor={acc.color || '#3b82f6'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaData} fill={`url(#grad-${acc.id})`} />
            <path d={pathData} fill="none" stroke={acc.color || '#3b82f6'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </GlowCard>
    );
  })}
  ```

- [ ] **Step 3: Verify and Commit**
  Run code checker: `npx tsc --noEmit` inside `frontend`
  Commit the changes:
  ```bash
  git add frontend/src/app/\(dashboard\)/dashboard/page.tsx
  git commit -m "feat: implement deterministic sparklines and GlowCard wrappers for wallets"
  ```

---

### Task 3: Implement Semi-Circular Gauge for Saving Goals and Convert Dashboard Cards to GlowCards

**Files:**
- Modify: `frontend/src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Replace dashboard summary cards and implement Saving Goals Gauge**
  Modify the summary grid links for `Saving Goals` (lines 272-286) to render a GlowCard container with the custom SVG gauge:
  ```tsx
  {/* Saving Goals Widget */}
  <GlowCard className="p-0 hover:border-primary/20">
    <Link href="/goals" className="p-6 block w-full h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <span className="material-symbols-outlined text-[20px]">target</span>
          </div>
          <span className="font-body-sm font-semibold">Saving Goals</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xl font-heading font-bold text-foreground truncate">
            {showBalance ? formatCurrency(savingSummary?.totalSaved ?? 0) : 'Rp ••••••'}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
            Terkumpul dari target {showBalance ? formatCurrency(savingSummary?.totalTarget ?? 0) : 'Rp ••••••'}
          </p>
        </div>
        
        {/* Semi-circular gauge */}
        {(() => {
          const progress = Math.min(savingSummary?.overallProgress ?? 0, 100);
          const strokeDasharray = 125.6; // Perimeter of radius 40 semi-circle (PI * 40)
          const strokeDashoffset = strokeDasharray - (strokeDasharray * progress) / 100;
          return (
            <div className="relative w-20 h-10 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                <defs>
                  <linearGradient id="savingsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke="var(--border)" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  opacity="0.15"
                />
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke="url(#savingsGradient)" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dashoffset] duration-1000 ease-out"
                />
              </svg>
              <div className="absolute bottom-0 text-[10px] font-bold text-foreground">
                {progress}%
              </div>
            </div>
          );
        })()}
      </div>
    </Link>
  </GlowCard>
  ```

- [ ] **Step 2: Replace Debt and Investment cards with GlowCard wrappers**
  Modify lines 288-334 to use `GlowCard`:
  ```tsx
  {/* Debt Widget */}
  <GlowCard className="p-0 hover:border-primary/20">
    <Link href="/debts" className="p-6 block w-full h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-amber-600">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10">
            <span className="material-symbols-outlined text-[20px]">paid</span>
          </div>
          <span className="font-body-sm font-semibold">Hutang & Piutang</span>
        </div>
        {debtSummary?.overdueCount && debtSummary.overdueCount > 0 ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">{debtSummary.overdueCount} Overdue</span>
        ) : null}
      </div>
      <div className={cn("text-xl font-heading font-bold truncate", (debtSummary?.netPosition ?? 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
        {showBalance ? formatCurrency(debtSummary?.netPosition ?? 0) : 'Rp ••••••'}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Piutang: {showBalance ? formatCurrency(debtSummary?.totalReceivable ?? 0) : 'Rp ••••••'} | Hutang: {showBalance ? formatCurrency(debtSummary?.totalPayable ?? 0) : 'Rp ••••••'}
      </p>
    </Link>
  </GlowCard>

  {/* Investment Widget */}
  <GlowCard className="p-0 hover:border-primary/20">
    <Link href="/investments" className="p-6 block w-full h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-violet-600">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10">
            <span className="material-symbols-outlined text-[20px]">trending_up</span>
          </div>
          <span className="font-body-sm font-semibold">Investasi</span>
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          (portfolioSummary?.totalGainLoss ?? 0) >= 0
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-red-500/10 text-red-600"
        )}>
          {(portfolioSummary?.totalGainLossPercent ?? 0) >= 0 ? '+' : ''}{portfolioSummary?.totalGainLossPercent ?? 0}%
        </span>
      </div>
      <div className="text-xl font-heading font-bold text-foreground truncate">
        {showBalance ? formatCurrency(portfolioSummary?.totalCurrentValue ?? 0) : 'Rp ••••••'}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Modal: {showBalance ? formatCurrency(portfolioSummary?.totalInvested ?? 0) : 'Rp ••••••'} | Gain: {showBalance ? formatCurrency(portfolioSummary?.totalGainLoss ?? 0) : 'Rp ••••••'}
      </p>
    </Link>
  </GlowCard>
  ```

- [ ] **Step 3: Verify and Commit**
  Run: `npm run build` or `npx tsc --noEmit` inside `frontend` to verify all components resolve correctly.
  Commit the changes:
  ```bash
  git add frontend/src/app/\(dashboard\)/dashboard/page.tsx
  git commit -m "feat: convert dashboard summary widgets to GlowCards and add circular goals gauge"
  ```
