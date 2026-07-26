# Actionable Notifications & Header Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform static notification system into an interactive, dynamic actionable notification center in the header and dashboard.

**Architecture:** Update backend `AlertsService` to perform dynamic evaluation on fetch and enrich alerts with action URLs/labels. Create a frontend `NotificationPopover` component in `BoltzHeader` and enhance `AlertCards` with direct action buttons.

**Tech Stack:** NestJS, Prisma, Next.js (React), Lucide React, React Query (TanStack Query), Tailwind CSS.

## Global Constraints

- Follow TDD: Write test before implementation.
- Immutability: Maintain clean React state.
- Single responsibility: Small, focused components.

---

### Task 1: Enriched Backend Alert Evaluation & Service Unit Tests

**Files:**
- Modify: `backend/src/modules/alerts/alerts.service.ts`
- Test: `backend/src/modules/alerts/alerts.service.spec.ts`

**Interfaces:**
- Consumes: Prisma database tables (`budget`, `debt`, `savingGoal`, `account`, `transaction`, `user`, `alert`).
- Produces: `getActiveAlerts(userId: string)` returning list of alerts enriched with `actionUrl` and `actionLabel`.

- [ ] **Step 1: Write the failing test for `getActiveAlerts` dynamic evaluation and action metadata mapping**

```typescript
// backend/src/modules/alerts/alerts.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { AlertsRepository } from './alerts.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let repo: jest.Mocked<AlertsRepository>;

  beforeEach(async () => {
    const mockRepo = {
      findActiveByUser: jest.fn(),
      upsertAlert: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteExpired: jest.fn(),
    };
    const mockPrisma = {
      budget: { findMany: jest.fn().mockResolvedValue([]) },
      debt: { findMany: jest.fn().mockResolvedValue([]) },
      savingGoal: { findMany: jest.fn().mockResolvedValue([]) },
      account: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      transaction: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }), groupBy: jest.fn().mockResolvedValue([]) },
      alert: { deleteMany: jest.fn(), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: AlertsRepository, useValue: mockRepo },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    repo = module.get(AlertsRepository);
  });

  it('should map actionUrl and actionLabel from metadata in getActiveAlerts', async () => {
    repo.findActiveByUser.mockResolvedValue([
      {
        id: 'alert-1',
        userId: 'u-1',
        type: 'GOAL_BEHIND_g1',
        title: 'Goal di Belakang Target',
        message: 'Tabungan "Rumah" baru 20%',
        severity: 'INFO',
        metadata: { goalId: 'g1', actionUrl: '/saving-goals', actionLabel: 'Setor Tabungan' },
        isRead: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      } as any,
    ]);

    const res = await service.getActiveAlerts('u-1');
    expect(res[0].actionUrl).toBe('/saving-goals');
    expect(res[0].actionLabel).toBe('Setor Tabungan');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx jest backend/src/modules/alerts/alerts.service.spec.ts`
Expected: FAIL due to missing dynamic call or property mapping in `getActiveAlerts`.

- [ ] **Step 3: Update `AlertsService` implementation**

Modify `backend/src/modules/alerts/alerts.service.ts`:
1. Call `await this.evaluateAlerts(userId)` inside `getActiveAlerts(userId)`.
2. Add `actionUrl` and `actionLabel` in `evaluateAlerts` for:
   - `BUDGET_OVERRUN`: `actionUrl: '/budgets'`, `actionLabel: 'Tinjau Anggaran'`
   - `DEBT_DUE`: `actionUrl: '/debts'`, `actionLabel: 'Kelola Utang'`
   - `GOAL_BEHIND`: `actionUrl: '/saving-goals'`, `actionLabel: 'Setor Tabungan'`
   - `LOW_BALANCE`: `actionUrl: '/transactions/new'`, `actionLabel: 'Catat Pemasukan'`
   - `POSITIVE_STREAK`: `actionUrl: '/dashboard'`, `actionLabel: 'Lihat Detail'`
3. Map `actionUrl` and `actionLabel` from `metadata` in `getActiveAlerts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest backend/src/modules/alerts/alerts.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/alerts/alerts.service.ts backend/src/modules/alerts/alerts.service.spec.ts
git commit -m "feat(backend): add dynamic evaluation and action metadata mapping to AlertsService"
```

---

### Task 2: Frontend API Types & Hooks Update

**Files:**
- Modify: `frontend/src/lib/api/alerts.api.ts`

**Interfaces:**
- Consumes: Backend `/alerts` endpoint.
- Produces: `AlertItem` interface with `actionUrl` and `actionLabel`.

- [ ] **Step 1: Update `AlertItem` interface in `frontend/src/lib/api/alerts.api.ts`**

```typescript
export interface AlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
  actionUrl?: string | null;
  actionLabel?: string | null;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  expiresAt: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/api/alerts.api.ts
git commit -m "feat(frontend): update AlertItem type with actionUrl and actionLabel"
```

---

### Task 3: Header Notification Popover Component Creation

**Files:**
- Create: `frontend/src/components/layout/notification-popover.tsx`
- Modify: `frontend/src/components/layout/boltz-header.tsx`

**Interfaces:**
- Consumes: `useAlerts`, `useMarkAlertRead`, `useMarkAllAlertsRead`.
- Produces: Interactive Notification Bell Popover component.

- [ ] **Step 1: Create `NotificationPopover` Component**

Create `frontend/src/components/layout/notification-popover.tsx`:
- Render Bell button with unread count badge.
- Render dropdown panel with smooth transition.
- Listen for click outside to close dropdown.
- Render notification items with icon, severity badge, text, `actionUrl` button, and dismiss $(X)$ button.
- Render empty state if no alerts exist.

- [ ] **Step 2: Integrate `NotificationPopover` into `BoltzHeader`**

Replace static Bell button in `frontend/src/components/layout/boltz-header.tsx` with `<NotificationPopover />`.

- [ ] **Step 3: Verify build / type checks**

Run: `npx tsc --noEmit` in `frontend` directory.
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/notification-popover.tsx frontend/src/components/layout/boltz-header.tsx
git commit -m "feat(frontend): create interactive NotificationPopover in BoltzHeader"
```

---

### Task 4: Enhance Dashboard Alert Cards with Action Buttons

**Files:**
- Modify: `frontend/src/components/dashboard/alert-cards.tsx`

**Interfaces:**
- Consumes: `AlertItem` from `useAlerts`.
- Produces: Enhanced `AlertCards` with inline CTA action buttons.

- [ ] **Step 1: Update `AlertCard` item to render CTA action button**

In `frontend/src/components/dashboard/alert-cards.tsx`:
Add action button next to title/message when `alert.actionUrl` and `alert.actionLabel` are present:
```tsx
{alert.actionUrl && alert.actionLabel && (
  <Link
    href={alert.actionUrl}
    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
  >
    <span>{alert.actionLabel}</span>
    <ArrowRight className="w-3 h-3" />
  </Link>
)}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` in `frontend` directory.
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/alert-cards.tsx
git commit -m "feat(frontend): add CTA action buttons to AlertCards on dashboard"
```

---

## Verification Plan

### Automated Verification
1. Run backend unit tests: `npx jest backend/src/modules/alerts/alerts.service.spec.ts`
2. Run frontend typecheck: `npx tsc --noEmit` in `frontend`

### Manual Verification
1. Open dashboard UI in browser.
2. Click Header Notification Bell -> observe popover opening/closing with badge counter.
3. Check goal behind alert item -> verify "Setor Tabungan" button links directly to `/saving-goals`.
