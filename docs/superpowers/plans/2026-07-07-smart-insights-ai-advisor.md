# Smart Dashboard + AI Financial Advisor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan tiga fitur ke Zayn Finance: (1) "Sisa Uang" Predictor, (2) Smart Alerts Engine, (3) AI Financial Advisor (Gemini).

**Architecture:** Backend NestJS — extend reports module untuk predictor, tambah dua modul baru (alerts, ai-advisor). Frontend Next.js — widget baru di dashboard, halaman /ai-advisor, alert cards. Semua data contextual di-aggregate di backend sebelum dikirim ke Gemini.

**Tech Stack:** NestJS, Prisma (PostgreSQL), @nestjs/schedule (existing), @google/generative-ai (new), Next.js App Router, TanStack Query.

## Global Constraints

- Error response shape: `{ success: false, error: { code, message, statusCode } }` via existing HttpExceptionFilter
- Semua route dilindungi JwtAuthGuard (global)
- Backend pattern: Repository → Service → Controller sesuai modul existing
- Frontend: data fetching via TanStack Query hooks di `src/hooks/`
- Frontend: API calls via apiClient di `src/lib/api/`
- Commit setelah setiap task selesai
- Backend error messages: English
- Frontend UI: Bahasa Indonesia

---

## File Map

### Backend — New
- `backend/src/modules/alerts/alerts.module.ts`
- `backend/src/modules/alerts/alerts.service.ts`
- `backend/src/modules/alerts/alerts.repository.ts`
- `backend/src/modules/alerts/alerts.controller.ts`
- `backend/src/modules/alerts/alerts.cron.ts`
- `backend/src/modules/ai-advisor/ai-advisor.module.ts`
- `backend/src/modules/ai-advisor/ai-advisor.service.ts`
- `backend/src/modules/ai-advisor/ai-advisor.controller.ts`
- `backend/src/modules/ai-advisor/ai-advisor.cron.ts`
- `backend/src/modules/ai-advisor/dto/create-session.dto.ts`
- `backend/src/modules/ai-advisor/dto/send-message.dto.ts`
- `backend/src/config/gemini.config.ts`

### Backend — Modified
- `backend/prisma/schema.prisma` — 4 model baru
- `backend/src/modules/reports/reports.repository.ts` — tambah `getMonthPredictor()`
- `backend/src/modules/reports/reports.service.ts` — tambah `getMonthPredictor()`
- `backend/src/modules/reports/reports.controller.ts` — tambah `GET /reports/month-predictor`
- `backend/src/app.module.ts` — register AlertsModule, AiAdvisorModule, geminiConfig

### Frontend — New
- `frontend/src/lib/api/reports.api.ts`
- `frontend/src/lib/api/alerts.api.ts`
- `frontend/src/lib/api/ai-advisor.api.ts`
- `frontend/src/hooks/use-month-predictor.ts`
- `frontend/src/hooks/use-alerts.ts`
- `frontend/src/hooks/use-ai-advisor.ts`
- `frontend/src/components/dashboard/month-predictor-widget.tsx`
- `frontend/src/components/dashboard/alert-cards.tsx`
- `frontend/src/components/ai-advisor/insight-card.tsx`
- `frontend/src/components/ai-advisor/chat-interface.tsx`
- `frontend/src/app/(dashboard)/ai-advisor/page.tsx`

### Frontend — Modified
- `frontend/src/lib/constants/query-keys.ts` — tambah keys baru
- `frontend/src/app/(dashboard)/dashboard/page.tsx` — widget + alert cards
- `frontend/src/app/(dashboard)/layout.tsx` — nav link AI Advisor

---

## Task 1: Database Migration

**Files:** `backend/prisma/schema.prisma`

- [ ] **Step 1: Tambah 4 model ke schema.prisma** (di bagian bawah file setelah model terakhir)

```prisma
model Alert {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  title     String
  message   String
  metadata  Json?
  isRead    Boolean  @default(false)
  severity  String
  createdAt DateTime @default(now())
  expiresAt DateTime
  @@index([userId, isRead])
  @@map("alerts")
}

model AiChatSession {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  context   String?
  contextId String?
  messages  AiChatMessage[]
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  @@map("ai_chat_sessions")
}

model AiChatMessage {
  id        String        @id @default(cuid())
  sessionId String
  session   AiChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role      String
  content   String
  createdAt DateTime      @default(now())
  @@map("ai_chat_messages")
}

model AiInsight {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  body        String
  actionLabel String?
  actionUrl   String?
  isRead      Boolean  @default(false)
  generatedAt DateTime @default(now())
  expiresAt   DateTime
  @@map("ai_insights")
}
```

Juga tambahkan relasi ke model `User` yang sudah ada:
```prisma
alerts         Alert[]
aiChatSessions AiChatSession[]
aiInsights     AiInsight[]
```

- [ ] **Step 2: Jalankan migration**
```bash
cd backend && npx prisma migrate dev --name add_alerts_and_ai_tables
```
Expected: `The following migration(s) have been applied`

- [ ] **Step 3: Commit**
```bash
git add backend/prisma/
git commit -m "feat(db): add alerts, ai_chat_sessions, ai_chat_messages, ai_insights tables"
```

---

## Task 2: Month Predictor Backend

**Files:** `reports.repository.ts`, `reports.service.ts`, `reports.controller.ts`

**Produces:** `GET /reports/month-predictor` → `MonthPredictorResult`

```typescript
interface MonthPredictorResult {
  currentBalance: number;
  projectedIncome: number;      // recurring income belum terjadi bulan ini
  projectedExpense: number;     // recurring expense + avg harian × sisa hari
  estimatedEndBalance: number;
  safeToSpend: number;          // estimatedEndBalance × 0.8
  daysRemaining: number;
  status: 'SAFE' | 'CAUTION' | 'DANGER';
  breakdown: { recurringIncome: number; recurringExpense: number; avgDailyExpense: number; projectedDailyExpense: number; }
}
```

- [ ] **Step 1: Tambah `getMonthPredictor(userId: string)` ke `reports.repository.ts`**

```typescript
async getMonthPredictor(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const daysRemaining = endOfMonth.getDate() - now.getDate();

  // Current balance
  const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { startingBalance: true } });
  const wallets = await this.prisma.account.findMany({ where: { userId }, select: { startingBalance: true } });
  const allTimeTx = await this.prisma.transaction.groupBy({ by: ['type'], where: { userId }, _sum: { amount: true } });
  let allIncome = 0, allExpense = 0;
  allTimeTx.forEach(t => { if (t.type === 'INCOME') allIncome = Number(t._sum.amount) || 0; if (t.type === 'EXPENSE') allExpense = Number(t._sum.amount) || 0; });
  const startBal = Number(user?.startingBalance || 0) + wallets.reduce((s, w) => s + Number(w.startingBalance || 0), 0);
  const currentBalance = startBal + allIncome - allExpense;

  // Recurring not yet occurred this month
  const recurring = await this.prisma.recurringTransaction.findMany({ where: { userId, isActive: true } });
  let recurringIncome = 0, recurringExpense = 0;
  recurring.forEach(rec => {
    const next = new Date(rec.nextDueDate);
    if (next >= now && next <= endOfMonth) {
      if (rec.type === 'INCOME') recurringIncome += Number(rec.amount);
      else if (rec.type === 'EXPENSE') recurringExpense += Number(rec.amount);
    }
  });

  // Avg daily expense (last 30 days)
  const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const recent = await this.prisma.transaction.findMany({ where: { userId, date: { gte: thirtyAgo }, type: 'EXPENSE' }, select: { amount: true } });
  const avgDailyExpense = recent.reduce((s, t) => s + Number(t.amount), 0) / 30;
  const projectedDailyExpense = avgDailyExpense * daysRemaining;

  // Monthly income for threshold
  const monthTx = await this.prisma.transaction.groupBy({ by: ['type'], where: { userId, date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } });
  let monthlyIncome = 0;
  monthTx.forEach(t => { if (t.type === 'INCOME') monthlyIncome = Number(t._sum.amount) || 0; });

  const projectedIncome = recurringIncome;
  const projectedExpense = recurringExpense + projectedDailyExpense;
  const estimatedEndBalance = currentBalance + projectedIncome - projectedExpense;
  const safeToSpend = estimatedEndBalance * 0.8;
  const threshold = monthlyIncome > 0 ? monthlyIncome : currentBalance;
  const status = estimatedEndBalance < threshold * 0.05 ? 'DANGER' : estimatedEndBalance < threshold * 0.2 ? 'CAUTION' : 'SAFE';

  return {
    currentBalance: Math.round(currentBalance),
    projectedIncome: Math.round(projectedIncome),
    projectedExpense: Math.round(projectedExpense),
    estimatedEndBalance: Math.round(estimatedEndBalance),
    safeToSpend: Math.round(safeToSpend),
    daysRemaining,
    status,
    breakdown: { recurringIncome: Math.round(recurringIncome), recurringExpense: Math.round(recurringExpense), avgDailyExpense: Math.round(avgDailyExpense), projectedDailyExpense: Math.round(projectedDailyExpense) },
  };
}
```

- [ ] **Step 2: Tambah ke `reports.service.ts`**
```typescript
async getMonthPredictor(userId: string) {
  return this.reportsRepository.getMonthPredictor(userId);
}
```

- [ ] **Step 3: Tambah endpoint ke `reports.controller.ts`**
```typescript
@Get('month-predictor')
@ApiOperation({ summary: 'Get estimated end-of-month balance' })
getMonthPredictor(@CurrentUser('id') userId: string) {
  return this.reportsService.getMonthPredictor(userId);
}
```

- [ ] **Step 4: Test via Swagger** — http://localhost:3001/api/docs → `GET /reports/month-predictor`
Expected: JSON dengan `currentBalance`, `status`, `estimatedEndBalance`

- [ ] **Step 5: Commit**
```bash
git add backend/src/modules/reports/
git commit -m "feat(reports): add month-predictor endpoint"
```

---

## Task 3: Month Predictor Frontend Widget

**Files:** `reports.api.ts`, `use-month-predictor.ts`, `month-predictor-widget.tsx`, `dashboard/page.tsx`

- [ ] **Step 1: Buat `frontend/src/lib/api/reports.api.ts`**
```typescript
import apiClient from './client';
import { ApiResponse } from '@/types/api.types';

export interface MonthPredictorData {
  currentBalance: number; projectedIncome: number; projectedExpense: number;
  estimatedEndBalance: number; safeToSpend: number; daysRemaining: number;
  status: 'SAFE' | 'CAUTION' | 'DANGER';
  breakdown: { recurringIncome: number; recurringExpense: number; avgDailyExpense: number; projectedDailyExpense: number; };
}

export const reportsApi = {
  getMonthPredictor: async (): Promise<MonthPredictorData> => {
    const res = await apiClient.get<ApiResponse<MonthPredictorData>>('/reports/month-predictor');
    return res.data.data;
  },
};
```

- [ ] **Step 2: Tambah query key** di `query-keys.ts`: `monthPredictor: ['month-predictor']`

- [ ] **Step 3: Buat `frontend/src/hooks/use-month-predictor.ts`**
```typescript
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports.api';
import { queryKeys } from '@/lib/constants/query-keys';

export const useMonthPredictor = () =>
  useQuery({ queryKey: queryKeys.monthPredictor, queryFn: reportsApi.getMonthPredictor, staleTime: 5 * 60 * 1000 });
```

- [ ] **Step 4: Buat `frontend/src/components/dashboard/month-predictor-widget.tsx`**
```typescript
'use client';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { useMonthPredictor } from '@/hooks/use-month-predictor';
import { Skeleton } from '@/components/ui/skeleton';

const cfg = {
  SAFE:    { label: 'Aman',       color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', Icon: TrendingUp },
  CAUTION: { label: 'Hati-Hati', color: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   Icon: Minus },
  DANGER:  { label: 'Perhatian', color: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     Icon: TrendingDown },
};

export function MonthPredictorWidget() {
  const { data, isLoading } = useMonthPredictor();
  if (isLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;
  if (!data) return null;
  const c = cfg[data.status];
  const { Icon } = c;
  const month = new Date().toLocaleString('id-ID', { month: 'long' });
  return (
    <div className={`rounded-2xl border p-4 ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">Estimasi Saldo Akhir {month}</span>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.color}`}>
          <Icon className="w-3 h-3" />{c.label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${c.color}`}>{formatCurrency(data.estimatedEndBalance)}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Masih {data.daysRemaining} hari · Aman dipakai: {formatCurrency(data.safeToSpend)}
      </p>
      <Link href="/reports" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors">
        Lihat detail <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
```

- [ ] **Step 5: Tambah ke `dashboard/page.tsx`** — import `MonthPredictorWidget` dan render setelah summary cards

- [ ] **Step 6: Verifikasi** — http://localhost:3000/dashboard, widget muncul dengan badge status berwarna

- [ ] **Step 7: Commit**
```bash
git add frontend/src/lib/api/reports.api.ts frontend/src/hooks/use-month-predictor.ts frontend/src/components/dashboard/month-predictor-widget.tsx frontend/src/lib/constants/query-keys.ts
git commit -m "feat(dashboard): add month predictor widget"
```

---

## Task 4: Smart Alerts Backend Module

**Files:** `alerts/` directory (5 files), `app.module.ts`

**Produces:** `GET /alerts`, `PATCH /alerts/:id/read`, `PATCH /alerts/read-all`, `POST /alerts/refresh`

> **Note:** Install `date-fns` jika belum: `cd backend && npm install date-fns`

- [ ] **Step 1: Buat `alerts.repository.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByUser(userId: string) {
    return this.prisma.alert.findMany({
      where: { userId, isRead: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertAlert(data: { userId: string; type: string; title: string; message: string; severity: string; metadata?: object; expiresAt: Date }) {
    await this.prisma.alert.deleteMany({ where: { userId: data.userId, type: data.type, isRead: false } });
    return this.prisma.alert.create({ data });
  }

  markAsRead(alertId: string, userId: string) {
    return this.prisma.alert.updateMany({ where: { id: alertId, userId }, data: { isRead: true } });
  }

  markAllAsRead(userId: string) {
    return this.prisma.alert.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  deleteExpired() {
    return this.prisma.alert.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }
}
```

- [ ] **Step 2: Buat `alerts.service.ts`** dengan 6 rules evaluation.

Rules yang harus diimplementasikan (lihat design spec untuk logika detail masing-masing):

| Rule | Trigger |
|------|---------|
| `BUDGET_OVERRUN_{categoryId}` | spending > 80% budget bulanan |
| `SPENDING_SPIKE_{categoryId}` | bulan ini > 130% avg 3 bulan lalu |
| `DEBT_DUE_{debtId}` | due date ≤ 7 hari |
| `GOAL_BEHIND_{goalId}` | progress < 80% expected pace |
| `LOW_BALANCE` | currentBalance < monthlyIncome × 5% |
| `POSITIVE_STREAK` | surplus 3 bulan berturut |

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsRepository } from './alerts.repository';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  constructor(private readonly repo: AlertsRepository, private readonly prisma: PrismaService) {}

  getActiveAlerts(userId: string) { return this.repo.findActiveByUser(userId); }
  markAsRead(userId: string, alertId: string) { return this.repo.markAsRead(alertId, userId); }
  markAllAsRead(userId: string) { return this.repo.markAllAsRead(userId); }

  async evaluateAlerts(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const expire3d = new Date(now); expire3d.setDate(now.getDate() + 3);
    const expire1d = new Date(now); expire1d.setDate(now.getDate() + 1);
    const expire7d = new Date(now); expire7d.setDate(now.getDate() + 7);

    // Rule 1: BUDGET_OVERRUN
    const budgets = await this.prisma.budget.findMany({ where: { userId, period: 'MONTHLY' }, include: { category: true } });
    for (const b of budgets) {
      if (!b.categoryId) continue;
      const spent = await this.prisma.transaction.aggregate({
        where: { userId, categoryId: b.categoryId, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      });
      const pct = Math.round((Number(spent._sum.amount) || 0) / Number(b.amount) * 100);
      if (pct >= 80) {
        await this.repo.upsertAlert({ userId, type: `BUDGET_OVERRUN_${b.categoryId}`, title: 'Budget Hampir Habis',
          message: `Budget ${b.category?.name} sudah terpakai ${pct}%`, severity: pct >= 100 ? 'DANGER' : 'WARNING',
          metadata: { budgetId: b.id, pct }, expiresAt: expire3d });
      }
    }

    // Rule 2: DEBT_DUE
    const due7d = new Date(now); due7d.setDate(now.getDate() + 7);
    const dueDebts = await this.prisma.debt.findMany({
      where: { userId, status: { in: ['PENDING', 'PARTIALLY_PAID'] }, dueDate: { gte: now, lte: due7d } },
    });
    for (const d of dueDebts) {
      const days = Math.ceil((new Date(d.dueDate!).getTime() - now.getTime()) / 86400000);
      await this.repo.upsertAlert({ userId, type: `DEBT_DUE_${d.id}`, title: 'Utang Jatuh Tempo',
        message: `${d.type === 'OWED_TO_ME' ? 'Piutang' : 'Utang'} ke ${d.personName} jatuh tempo ${days === 0 ? 'hari ini' : `${days} hari lagi`}`,
        severity: 'DANGER', metadata: { debtId: d.id, days }, expiresAt: expire1d });
    }

    // Rule 3: GOAL_BEHIND
    const goals = await this.prisma.savingGoal.findMany({ where: { userId, status: 'ACTIVE', deadline: { not: null } } });
    for (const g of goals) {
      if (!g.deadline) continue;
      const totalDays = Math.max((new Date(g.deadline).getTime() - new Date(g.createdAt).getTime()) / 86400000, 1);
      const daysPassed = (now.getTime() - new Date(g.createdAt).getTime()) / 86400000;
      const expectedPct = Math.min(daysPassed / totalDays, 1);
      const actualPct = Number(g.currentAmount) / Number(g.targetAmount);
      if (actualPct < expectedPct * 0.8) {
        await this.repo.upsertAlert({ userId, type: `GOAL_BEHIND_${g.id}`, title: 'Goal di Belakang Target',
          message: `Tabungan "${g.name}" baru ${Math.round(actualPct * 100)}%, seharusnya ${Math.round(expectedPct * 100)}%`,
          severity: 'INFO', metadata: { goalId: g.id }, expiresAt: expire3d });
      }
    }

    // Rule 4: LOW_BALANCE
    const wallets = await this.prisma.account.findMany({ where: { userId }, select: { startingBalance: true } });
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { startingBalance: true } });
    const atx = await this.prisma.transaction.groupBy({ by: ['type'], where: { userId }, _sum: { amount: true } });
    let ai = 0, ae = 0; atx.forEach(t => { if (t.type === 'INCOME') ai = Number(t._sum.amount)||0; if (t.type === 'EXPENSE') ae = Number(t._sum.amount)||0; });
    const bal = Number(user?.startingBalance||0) + wallets.reduce((s,w) => s+Number(w.startingBalance||0),0) + ai - ae;
    const mTx = await this.prisma.transaction.aggregate({ where: { userId, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } });
    const mInc = Number(mTx._sum.amount)||bal;
    if (bal < mInc * 0.05) {
      await this.repo.upsertAlert({ userId, type: 'LOW_BALANCE', title: 'Saldo Kritis',
        message: 'Saldo kamu sangat rendah. Perhatikan pengeluaran bulan ini.', severity: 'DANGER', expiresAt: expire1d });
    }

    // Rule 5: POSITIVE_STREAK
    let streak = true;
    for (let i = 1; i <= 3; i++) {
      const s = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const e = new Date(now.getFullYear(), now.getMonth()-i+1, 0, 23, 59, 59, 999);
      const tx = await this.prisma.transaction.groupBy({ by: ['type'], where: { userId, date: { gte: s, lte: e } }, _sum: { amount: true } });
      let inc = 0, exp = 0; tx.forEach(t => { if (t.type==='INCOME') inc=Number(t._sum.amount)||0; if (t.type==='EXPENSE') exp=Number(t._sum.amount)||0; });
      if (inc <= exp) { streak = false; break; }
    }
    if (streak) {
      await this.repo.upsertAlert({ userId, type: 'POSITIVE_STREAK', title: 'Streak Surplus! 🎉',
        message: 'Keuanganmu surplus 3 bulan berturut-turut. Pertahankan!', severity: 'SUCCESS', expiresAt: expire7d });
    }

    await this.repo.deleteExpired();
  }
}
```

- [ ] **Step 3: Buat `alerts.controller.ts`**
```typescript
import { Controller, Get, Patch, Post, Param, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Alerts') @ApiBearerAuth('access-token') @Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}
  @Get() @ApiOperation({ summary: 'Get active alerts' })
  get(@CurrentUser('id') userId: string) { return this.alertsService.getActiveAlerts(userId); }
  @Patch(':id/read') @HttpCode(200) @ApiOperation({ summary: 'Mark alert as read' })
  read(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.alertsService.markAsRead(userId, id); }
  @Patch('read-all') @HttpCode(200) @ApiOperation({ summary: 'Mark all as read' })
  readAll(@CurrentUser('id') userId: string) { return this.alertsService.markAllAsRead(userId); }
  @Post('refresh') @HttpCode(200) @ApiOperation({ summary: 'Trigger evaluation' })
  refresh(@CurrentUser('id') userId: string) { return this.alertsService.evaluateAlerts(userId); }
}
```

- [ ] **Step 4: Buat `alerts.cron.ts`**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from './alerts.service';

@Injectable()
export class AlertsCron {
  private readonly logger = new Logger(AlertsCron.name);
  constructor(private readonly alertsService: AlertsService, private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async run() {
    const users = await this.prisma.user.findMany({ where: { role: 'USER' }, select: { id: true } });
    for (const u of users) {
      try { await this.alertsService.evaluateAlerts(u.id); }
      catch(e) { this.logger.error(`Alert eval failed for ${u.id}`, e); }
    }
  }
}
```

- [ ] **Step 5: Buat `alerts.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsRepository } from './alerts.repository';
import { AlertsCron } from './alerts.cron';

@Module({ controllers: [AlertsController], providers: [AlertsService, AlertsRepository, AlertsCron], exports: [AlertsService] })
export class AlertsModule {}
```

- [ ] **Step 6: Register di `app.module.ts`** — tambah import `AlertsModule` ke array `imports`

- [ ] **Step 7: Test** — `POST /alerts/refresh` di Swagger, lalu `GET /alerts`

- [ ] **Step 8: Commit**
```bash
git add backend/src/modules/alerts/ backend/src/app.module.ts
git commit -m "feat(alerts): add smart alerts engine with 6 rules and cron"
```

---

## Task 5: Smart Alerts Frontend

**Files:** `alerts.api.ts`, `use-alerts.ts`, `alert-cards.tsx`, `dashboard/page.tsx`

- [ ] **Step 1: Buat `frontend/src/lib/api/alerts.api.ts`**
```typescript
import apiClient from './client';
import { ApiResponse } from '@/types/api.types';

export interface AlertItem {
  id: string; type: string; title: string; message: string;
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
  isRead: boolean; metadata: Record<string, unknown> | null;
  createdAt: string; expiresAt: string;
}

export const alertsApi = {
  getAlerts: async (): Promise<AlertItem[]> => (await apiClient.get<ApiResponse<AlertItem[]>>('/alerts')).data.data,
  markAsRead: async (id: string): Promise<void> => { await apiClient.patch(`/alerts/${id}/read`); },
  markAllAsRead: async (): Promise<void> => { await apiClient.patch('/alerts/read-all'); },
  refresh: async (): Promise<void> => { await apiClient.post('/alerts/refresh'); },
};
```

- [ ] **Step 2: Tambah query key** di `query-keys.ts`: `alerts: ['alerts']`

- [ ] **Step 3: Buat `frontend/src/hooks/use-alerts.ts`**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api/alerts.api';
import { queryKeys } from '@/lib/constants/query-keys';

export const useAlerts = () =>
  useQuery({ queryKey: queryKeys.alerts, queryFn: alertsApi.getAlerts, staleTime: 60000 });

export const useMarkAlertRead = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: alertsApi.markAsRead, onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts }) });
};

export const useMarkAllAlertsRead = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: alertsApi.markAllAsRead, onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts }) });
};
```

- [ ] **Step 4: Buat `frontend/src/components/dashboard/alert-cards.tsx`**
```typescript
'use client';
import { X, AlertTriangle, Info, CheckCircle, TrendingDown } from 'lucide-react';
import { AlertItem } from '@/lib/api/alerts.api';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead } from '@/hooks/use-alerts';

const sev = {
  INFO:    { Icon: Info,          color: 'text-blue-500',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  WARNING: { Icon: AlertTriangle, color: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  DANGER:  { Icon: TrendingDown,  color: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  SUCCESS: { Icon: CheckCircle,   color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

function AlertCard({ alert }: { alert: AlertItem }) {
  const markRead = useMarkAlertRead();
  const c = sev[alert.severity]; const { Icon } = c;
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${c.bg} ${c.border}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${c.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{alert.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
      </div>
      <button onClick={() => markRead.mutate(alert.id)} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function AlertCards() {
  const { data: alerts } = useAlerts();
  const markAll = useMarkAllAlertsRead();
  if (!alerts?.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Notifikasi</p>
        {alerts.length > 1 && <button onClick={() => markAll.mutate()} className="text-xs text-muted-foreground hover:text-foreground">Tandai semua dibaca</button>}
      </div>
      {alerts.slice(0, 3).map(a => <AlertCard key={a.id} alert={a} />)}
    </div>
  );
}
```

- [ ] **Step 5: Tambah ke `dashboard/page.tsx`** — import dan render `<AlertCards />` di atas MonthPredictorWidget

- [ ] **Step 6: Commit**
```bash
git add frontend/src/lib/api/alerts.api.ts frontend/src/hooks/use-alerts.ts frontend/src/components/dashboard/alert-cards.tsx
git commit -m "feat(dashboard): add smart alert cards"
```

---

## Task 6: AI Advisor Backend Module

**Files:** `ai-advisor/` directory (7 files), `gemini.config.ts`, `app.module.ts`

- [ ] **Step 1: Install Gemini SDK**
```bash
cd backend && npm install @google/generative-ai
```

- [ ] **Step 2: Tambah `GEMINI_API_KEY` ke `backend/.env` dan `backend/.env.example`**
```
GEMINI_API_KEY=your_key_here
```
Dapatkan API key di: https://aistudio.google.com/app/apikey

- [ ] **Step 3: Buat `backend/src/config/gemini.config.ts`**
```typescript
import { registerAs } from '@nestjs/config';
export default registerAs('gemini', () => ({ apiKey: process.env.GEMINI_API_KEY || '' }));
```

- [ ] **Step 4: Buat DTOs**

`dto/create-session.dto.ts`:
```typescript
import { IsOptional, IsString } from 'class-validator';
export class CreateSessionDto {
  @IsOptional() @IsString() context?: 'GENERAL' | 'DEBT' | 'GOAL' | 'INVESTMENT';
  @IsOptional() @IsString() contextId?: string;
}
```

`dto/send-message.dto.ts`:
```typescript
import { IsString, MinLength } from 'class-validator';
export class SendMessageDto { @IsString() @MinLength(1) content: string; }
```

- [ ] **Step 5: Buat `ai-advisor.service.ts`**

Service ini berisi 4 method publik: `createSession`, `getSession`, `sendMessage`, `getInsights`, `generateInsightsForUser`.

Method `buildFinancialContext(userId, context, contextId)` aggregate data dari Prisma:
- currentBalance (dari wallets + all-time transactions)
- monthlyIncome, monthlyExpense
- topCategories (top 5, raw SQL groupBy categoryId)
- activeGoals, activeDebts
- Jika context = DEBT/GOAL, tambahkan detail spesifik dari contextId

Method `getSystemPrompt(contextText)` return string instruksi Bahasa Indonesia.

Method `sendMessage`: save user message → build context → call `gemini-1.5-flash` → save + return assistant message.

Method `generateInsightsForUser`: build context → prompt Gemini untuk return JSON array 3 insight → parse → save ke `ai_insights` table (hapus old insights dulu, expire 7 hari).

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class AiAdvisorService {
  private readonly logger = new Logger(AiAdvisorService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    this.genAI = new GoogleGenerativeAI(this.config.get<string>('gemini.apiKey') || '');
  }

  createSession(userId: string, dto: CreateSessionDto) {
    return this.prisma.aiChatSession.create({ data: { userId, context: dto.context || 'GENERAL', contextId: dto.contextId } });
  }

  getSession(userId: string, sessionId: string) {
    return this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async sendMessage(userId: string, sessionId: string, content: string) {
    const session = await this.getSession(userId, sessionId);
    if (!session) throw new Error('Session not found');
    await this.prisma.aiChatMessage.create({ data: { sessionId, role: 'user', content } });
    const ctx = await this.buildFinancialContext(userId, session.context, session.contextId);
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`${this.getSystemPrompt(ctx)}\n\nPertanyaan: ${content}`);
    const reply = result.response.text();
    await this.prisma.aiChatMessage.create({ data: { sessionId, role: 'assistant', content: reply } });
    return { role: 'assistant', content: reply };
  }

  getInsights(userId: string) {
    return this.prisma.aiInsight.findMany({
      where: { userId, isRead: false, expiresAt: { gt: new Date() } },
      orderBy: { generatedAt: 'desc' }, take: 3,
    });
  }

  async generateInsightsForUser(userId: string) {
    const ctx = await this.buildFinancialContext(userId, 'GENERAL', null);
    await this.prisma.aiInsight.deleteMany({ where: { userId } });
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `${this.getSystemPrompt(ctx)}\n\nBerikan TEPAT 3 insight keuangan dalam format JSON array (tanpa markdown):\n[{"title":"max 8 kata","body":"2-3 kalimat actionable","actionLabel":null,"actionUrl":null}]`;
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
      const items: Array<{ title: string; body: string; actionLabel?: string; actionUrl?: string }> = JSON.parse(text);
      const exp = new Date(); exp.setDate(exp.getDate() + 7);
      for (const item of items.slice(0, 3)) {
        await this.prisma.aiInsight.create({ data: { userId, title: item.title, body: item.body, actionLabel: item.actionLabel||null, actionUrl: item.actionUrl||null, expiresAt: exp } });
      }
    } catch(e) { this.logger.error(`Insight generation failed for ${userId}`, e); }
  }

  private async buildFinancialContext(userId: string, context: string|null, contextId: string|null): Promise<string> {
    const now = new Date();
    const som = new Date(now.getFullYear(), now.getMonth(), 1);
    const eom = new Date(now.getFullYear(), now.getMonth()+1, 0, 23, 59, 59, 999);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { startingBalance: true } });
    const wallets = await this.prisma.account.findMany({ where: { userId }, select: { startingBalance: true } });
    const atx = await this.prisma.transaction.groupBy({ by: ['type'], where: { userId }, _sum: { amount: true } });
    let ai=0, ae=0; atx.forEach(t => { if(t.type==='INCOME') ai=Number(t._sum.amount)||0; if(t.type==='EXPENSE') ae=Number(t._sum.amount)||0; });
    const bal = Number(user?.startingBalance||0)+wallets.reduce((s,w)=>s+Number(w.startingBalance||0),0)+ai-ae;
    const mtx = await this.prisma.transaction.groupBy({ by: ['type'], where: { userId, date: { gte: som, lte: eom } }, _sum: { amount: true } });
    let mi=0, me=0; mtx.forEach(t => { if(t.type==='INCOME') mi=Number(t._sum.amount)||0; if(t.type==='EXPENSE') me=Number(t._sum.amount)||0; });
    const topCat = await this.prisma.$queryRaw<Array<{name:string;total:number}>>`
      SELECT c."name", CAST(SUM(t."amount") AS FLOAT) as total FROM "transactions" t JOIN "categories" c ON t."categoryId"=c."id"
      WHERE t."userId"=${userId} AND t."type"='EXPENSE' AND t."date">=${som} AND t."date"<=${eom}
      GROUP BY c."name" ORDER BY total DESC LIMIT 5`;
    const goals = await this.prisma.savingGoal.findMany({ where: { userId, status: 'ACTIVE' }, select: { name: true, targetAmount: true, currentAmount: true } });
    const debts = await this.prisma.debt.findMany({ where: { userId, status: { in: ['PENDING','PARTIALLY_PAID'] } }, select: { personName: true, type: true, totalAmount: true, paidAmount: true }, take: 5 });
    let extra = '';
    if (context==='DEBT' && contextId) {
      const d = await this.prisma.debt.findUnique({ where: { id: contextId } });
      if (d) extra = `\nKonteks: utang/piutang ke ${d.personName}, total Rp${Number(d.totalAmount).toLocaleString('id-ID')}, dibayar Rp${Number(d.paidAmount).toLocaleString('id-ID')}.`;
    } else if (context==='GOAL' && contextId) {
      const g = await this.prisma.savingGoal.findUnique({ where: { id: contextId } });
      if (g) extra = `\nKonteks: goal "${g.name}", target Rp${Number(g.targetAmount).toLocaleString('id-ID')}, terkumpul Rp${Number(g.currentAmount).toLocaleString('id-ID')}.`;
    }
    return `Saldo: Rp${Math.round(bal).toLocaleString('id-ID')}\nPemasukan bulan ini: Rp${Math.round(mi).toLocaleString('id-ID')}\nPengeluaran bulan ini: Rp${Math.round(me).toLocaleString('id-ID')}\nTop kategori: ${topCat.map(c=>`${c.name}(Rp${Math.round(c.total).toLocaleString('id-ID')})`).join(', ')}\nGoals: ${goals.map(g=>`${g.name}(${Math.round(Number(g.currentAmount)/Number(g.targetAmount)*100)}%)`).join(', ')||'Tidak ada'}\nUtang: ${debts.map(d=>`${d.type==='OWED_TO_ME'?'Piutang':'Utang'} ke ${d.personName}`).join(', ')||'Tidak ada'}${extra}`;
  }

  private getSystemPrompt(ctx: string): string {
    return `Kamu adalah AI financial advisor untuk Zayn Finance.\n\nKondisi keuangan pengguna:\n${ctx}\n\nInstruksi:\n- Jawab Bahasa Indonesia, natural dan ramah\n- Saran spesifik dan actionable\n- Jangan rekomendasikan produk luar\n- Maks 3 paragraf\n- Format Rp untuk nominal`;
  }
}
```

- [ ] **Step 6: Buat `ai-advisor.controller.ts`**
```typescript
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiAdvisorService } from './ai-advisor.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('AI Advisor') @ApiBearerAuth('access-token') @Controller('ai-advisor')
export class AiAdvisorController {
  constructor(private readonly svc: AiAdvisorService) {}
  @Get('insights') @ApiOperation({ summary: 'Get weekly AI insights' })
  insights(@CurrentUser('id') id: string) { return this.svc.getInsights(id); }
  @Post('sessions') @ApiOperation({ summary: 'Create chat session' })
  create(@CurrentUser('id') id: string, @Body() dto: CreateSessionDto) { return this.svc.createSession(id, dto); }
  @Get('sessions/:id') @ApiOperation({ summary: 'Get session + messages' })
  get(@CurrentUser('id') uid: string, @Param('id') id: string) { return this.svc.getSession(uid, id); }
  @Post('sessions/:id/messages') @ApiOperation({ summary: 'Send message to AI' })
  msg(@CurrentUser('id') uid: string, @Param('id') id: string, @Body() dto: SendMessageDto) { return this.svc.sendMessage(uid, id, dto.content); }
  @Post('insights/generate') @ApiOperation({ summary: 'Trigger insight generation' })
  gen(@CurrentUser('id') id: string) { return this.svc.generateInsightsForUser(id); }
}
```

- [ ] **Step 7: Buat `ai-advisor.cron.ts`**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AiAdvisorService } from './ai-advisor.service';

@Injectable()
export class AiAdvisorCron {
  private readonly logger = new Logger(AiAdvisorCron.name);
  constructor(private readonly svc: AiAdvisorService, private readonly prisma: PrismaService) {}

  @Cron('0 0 * * 1') // Senin 00:00 UTC = 07:00 WIB
  async run() {
    const ago30 = new Date(); ago30.setDate(ago30.getDate()-30);
    const users = await this.prisma.user.findMany({ where: { role: 'USER', updatedAt: { gte: ago30 } }, select: { id: true } });
    for (const u of users) {
      try { await this.svc.generateInsightsForUser(u.id); }
      catch(e) { this.logger.error(`Insight gen failed for ${u.id}`, e); }
    }
  }
}
```

- [ ] **Step 8: Buat `ai-advisor.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { AiAdvisorService } from './ai-advisor.service';
import { AiAdvisorController } from './ai-advisor.controller';
import { AiAdvisorCron } from './ai-advisor.cron';

@Module({ controllers: [AiAdvisorController], providers: [AiAdvisorService, AiAdvisorCron], exports: [AiAdvisorService] })
export class AiAdvisorModule {}
```

- [ ] **Step 9: Update `app.module.ts`** — tambah import `AiAdvisorModule` dan `geminiConfig` ke load array

- [ ] **Step 10: Test** — `POST /ai-advisor/sessions` → `POST /ai-advisor/sessions/{id}/messages` dengan `{ "content": "Bagaimana kondisi keuanganku?" }`

- [ ] **Step 11: Commit**
```bash
git add backend/src/modules/ai-advisor/ backend/src/config/gemini.config.ts backend/src/app.module.ts backend/.env.example
git commit -m "feat(ai-advisor): add Gemini AI advisor backend"
```

---

## Task 7: AI Advisor Frontend

**Files:** `ai-advisor.api.ts`, `use-ai-advisor.ts`, `insight-card.tsx`, `chat-interface.tsx`, `ai-advisor/page.tsx`, `layout.tsx`

- [ ] **Step 1: Buat `frontend/src/lib/api/ai-advisor.api.ts`**
```typescript
import apiClient from './client';
import { ApiResponse } from '@/types/api.types';

export interface AiInsight { id: string; title: string; body: string; actionLabel: string|null; actionUrl: string|null; isRead: boolean; generatedAt: string; }
export interface ChatMessage { id: string; role: 'user'|'assistant'; content: string; createdAt: string; }
export interface ChatSession { id: string; context: string; contextId: string|null; createdAt: string; messages: ChatMessage[]; }

export const aiAdvisorApi = {
  getInsights: async (): Promise<AiInsight[]> => (await apiClient.get<ApiResponse<AiInsight[]>>('/ai-advisor/insights')).data.data,
  createSession: async (context='GENERAL', contextId?: string): Promise<ChatSession> => (await apiClient.post<ApiResponse<ChatSession>>('/ai-advisor/sessions', { context, contextId })).data.data,
  getSession: async (id: string): Promise<ChatSession> => (await apiClient.get<ApiResponse<ChatSession>>(`/ai-advisor/sessions/${id}`)).data.data,
  sendMessage: async (sessionId: string, content: string): Promise<ChatMessage> => (await apiClient.post<ApiResponse<ChatMessage>>(`/ai-advisor/sessions/${sessionId}/messages`, { content })).data.data,
  generateInsights: async (): Promise<void> => { await apiClient.post('/ai-advisor/insights/generate'); },
};
```

- [ ] **Step 2: Tambah query keys**
```typescript
aiInsights: ['ai-insights'],
aiSession: (id: string) => ['ai-session', id],
```

- [ ] **Step 3: Buat `frontend/src/hooks/use-ai-advisor.ts`**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAdvisorApi } from '@/lib/api/ai-advisor.api';
import { queryKeys } from '@/lib/constants/query-keys';

export const useAiInsights = () => useQuery({ queryKey: queryKeys.aiInsights, queryFn: aiAdvisorApi.getInsights, staleTime: 10*60*1000 });
export const useGenerateInsights = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: aiAdvisorApi.generateInsights, onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.aiInsights }) });
};
```

- [ ] **Step 4: Buat `frontend/src/components/ai-advisor/insight-card.tsx`**
```typescript
'use client';
import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';
import { AiInsight } from '@/lib/api/ai-advisor.api';

export function InsightCard({ insight, onAskMore }: { insight: AiInsight; onAskMore: (i: AiInsight) => void }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 space-y-2 hover:border-indigo-500/30 transition-all">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-sm font-semibold">{insight.title}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-6">{insight.body}</p>
      <div className="flex items-center gap-2 pl-6">
        <button onClick={() => onAskMore(insight)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
          Tanya lebih lanjut <ChevronRight className="w-3 h-3" />
        </button>
        {insight.actionLabel && insight.actionUrl && (
          <><span className="text-muted-foreground">·</span>
          <Link href={insight.actionUrl} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            {insight.actionLabel} <ChevronRight className="w-3 h-3" />
          </Link></>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Buat `frontend/src/components/ai-advisor/chat-interface.tsx`**

Component ini memiliki state: `sessionId`, `messages`, `input`, `isLoading`.

Flow: user submit → `initSession()` (jika belum ada session, POST /sessions) → `sendMessage()` → tambah pesan user ke state → call `aiAdvisorApi.sendMessage()` → tambah response AI ke state.

Tampilan: scrollable messages area + input box + suggested questions saat messages kosong.

```typescript
'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { aiAdvisorApi, ChatMessage } from '@/lib/api/ai-advisor.api';
import { toast } from 'sonner';

const SUGGESTIONS = ['Bagaimana kondisi keuanganku bulan ini?','Kategori apa yang paling boros?','Apakah aku bisa capai goal tabunganku?','Berapa uang yang aman kupakai minggu ini?'];

export function ChatInterface({ initialMessage='', context='GENERAL', contextId }: { initialMessage?: string; context?: string; contextId?: string }) {
  const [sid, setSid] = useState<string|null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);
  useEffect(() => { setInput(initialMessage); }, [initialMessage]);

  const init = async (): Promise<string> => {
    if (sid) return sid;
    const s = await aiAdvisorApi.createSession(context, contextId);
    setSid(s.id); return s.id;
  };

  const send = async (content: string = input) => {
    if (!content.trim() || loading) return;
    setInput('');
    setMsgs(p => [...p, { id: Date.now().toString(), role: 'user', content, createdAt: new Date().toISOString() }]);
    setLoading(true);
    try {
      const id = await init();
      const r = await aiAdvisorApi.sendMessage(id, content);
      setMsgs(p => [...p, { ...r, id: Date.now().toString()+'-ai', createdAt: new Date().toISOString() }]);
    } catch { toast.error('Gagal menghubungi AI. Coba lagi.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] rounded-2xl border border-border/60 bg-card/30 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!msgs.length && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center py-4">Tanya apa saja tentang keuanganmu</p>
            {SUGGESTIONS.map(q => <button key={q} onClick={() => send(q)} className="block w-full text-left text-xs text-muted-foreground hover:text-foreground border border-border/40 hover:border-border rounded-xl px-3 py-2 transition-all">{q}</button>)}
          </div>
        )}
        {msgs.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.role==='user'?'justify-end':'justify-start'}`}>
            {m.role==='assistant' && <Bot className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />}
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role==='user'?'bg-indigo-600 text-white':'bg-muted/60'}`}>{m.content}</div>
            {m.role==='user' && <User className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />}
          </div>
        ))}
        {loading && <div className="flex gap-2"><Bot className="w-5 h-5 text-indigo-400 shrink-0" /><div className="bg-muted/60 rounded-2xl px-3 py-2"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div></div>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border/40 p-3">
        <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Tanya AI tentang keuanganmu..." disabled={loading}
            className="flex-1 bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500/60 transition-colors" />
          <button type="submit" disabled={!input.trim()||loading} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl px-3 py-2 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Buat `frontend/src/app/(dashboard)/ai-advisor/page.tsx`**
```typescript
'use client';
import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAiInsights, useGenerateInsights } from '@/hooks/use-ai-advisor';
import { InsightCard } from '@/components/ai-advisor/insight-card';
import { ChatInterface } from '@/components/ai-advisor/chat-interface';
import { AiInsight } from '@/lib/api/ai-advisor.api';
import { Skeleton } from '@/components/ui/skeleton';

export default function AiAdvisorPage() {
  const { data: insights, isLoading } = useAiInsights();
  const gen = useGenerateInsights();
  const [chatMsg, setChatMsg] = useState('');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-indigo-400" />AI Financial Advisor</h1>
          <p className="text-muted-foreground mt-1">Insight personal dan konsultasi keuangan berbasis AI</p>
        </div>
        <button onClick={() => gen.mutate()} disabled={gen.isPending}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border/40 rounded-xl px-3 py-2 transition-all">
          <RefreshCw className={`w-4 h-4 ${gen.isPending?'animate-spin':''}`} />Generate Insight Baru
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Insight Minggu Ini</h2>
          {isLoading ? <><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></> :
           insights?.length ? insights.map(i => <InsightCard key={i.id} insight={i} onAskMore={(ins: AiInsight) => setChatMsg(`Ceritakan lebih lanjut: ${ins.title}`)} />) :
           <div className="rounded-2xl border border-border/40 p-8 text-center"><Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Klik "Generate Insight Baru" untuk memulai.</p></div>}
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tanya AI</h2>
          <ChatInterface initialMessage={chatMsg} context="GENERAL" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Tambah nav link di `layout.tsx`**

Cari array navigasi di `frontend/src/app/(dashboard)/layout.tsx`. Tambahkan:
```typescript
import { Sparkles } from 'lucide-react';
// Di array nav:
{ href: '/ai-advisor', label: 'AI Advisor', icon: Sparkles }
```

- [ ] **Step 8: Verifikasi end-to-end**
  1. Buka http://localhost:3000/ai-advisor
  2. Klik "Generate Insight Baru" → 3 kartu insight muncul
  3. Ketik pertanyaan → AI menjawab Bahasa Indonesia
  4. Klik "Tanya lebih lanjut" di insight → chat terpopulasi

- [ ] **Step 9: Commit**
```bash
git add frontend/src/lib/api/ai-advisor.api.ts frontend/src/hooks/use-ai-advisor.ts frontend/src/components/ai-advisor/ "frontend/src/app/(dashboard)/ai-advisor/" "frontend/src/app/(dashboard)/layout.tsx" frontend/src/lib/constants/query-keys.ts
git commit -m "feat(ai-advisor): add AI advisor page with insight cards and chat"
```

---

## Task 8: Final Build Check

- [ ] **Step 1: Build backend**
```bash
cd backend && npm run build
```
Expected: no TypeScript errors

- [ ] **Step 2: Build frontend**
```bash
cd frontend && npm run build
```
Expected: no TypeScript errors

- [ ] **Step 3: Final commit**
```bash
git add . && git commit -m "feat: complete smart dashboard + AI advisor (month predictor, alerts, AI chat)"
```

---

## Ringkasan

| Task | Deskripsi | Estimasi |
|------|-----------|---------|
| 1 | DB Migration | 15 menit |
| 2 | Month Predictor Backend | 30 menit |
| 3 | Month Predictor Frontend | 45 menit |
| 4 | Smart Alerts Backend | 90 menit |
| 5 | Smart Alerts Frontend | 45 menit |
| 6 | AI Advisor Backend | 90 menit |
| 7 | AI Advisor Frontend | 90 menit |
| 8 | Final Build Check | 15 menit |
| **Total** | | **~7 jam** |
