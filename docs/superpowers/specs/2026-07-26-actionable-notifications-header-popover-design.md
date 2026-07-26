# Actionable Notifications & Header Popover Design

## Overview
Transform the static header notification bell into an interactive, real-time Actionable Notification System. Ensure notifications dynamically alert users about financial events (such as behind-schedule saving goals, budget overruns, upcoming debt due dates, low cash balance, and surplus streaks) with direct Call-To-Action (CTA) buttons allowing instant user resolution.

---

## Key Features & Requirements

1. **Backend Dynamic Evaluation & Enriched Data**:
   - `GET /alerts` dynamically triggers `evaluateAlerts(userId)` before returning active alerts so notifications are always up to date.
   - Alert items include `actionUrl` and `actionLabel` to facilitate direct navigation/action from UI cards.
   - Evaluates:
     - `GOAL_BEHIND`: Alert when saving goal progress lags behind schedule (`actualPct < expectedPct * 0.8`). CTA: *"Setor Tabungan"* -> `/saving-goals`.
     - `BUDGET_OVERRUN`: Alert when category spend is $\ge 80\%$ or $\ge 100\%$. CTA: *"Tinjau Anggaran"* -> `/budgets`.
     - `DEBT_DUE`: Alert when debt/receivable is due in $\le 7$ days. CTA: *"Kelola Utang"* -> `/debts`.
     - `LOW_BALANCE`: Alert when cash/bank balance $< 5\%$ of monthly income. CTA: *"Catat Pemasukan"* -> `/transactions/new`.
     - `POSITIVE_STREAK`: Success notification when surplus for 3 consecutive months.

2. **Interactive Header Notification Popover (`BoltzHeader`)**:
   - Replace static bell icon in `frontend/src/components/layout/boltz-header.tsx` with a fully interactive `NotificationPopover`.
   - Displays unread counter badge.
   - Click to open popover menu with smooth animation, outside-click listener, and keyboard ESC closure.
   - List up to 5 recent active notifications with severity styling (INFO, WARNING, DANGER, SUCCESS), CTA buttons, and individual mark-as-read/dismiss $(X)$ buttons.
   - Header action: *"Tandai semua dibaca"* to clear all active notifications.
   - Clean Empty State graphic when 0 unread/active notifications exist.

3. **Enhanced Dashboard Alert Cards (`AlertCards`)**:
   - Update `frontend/src/components/dashboard/alert-cards.tsx` to display CTA buttons inline on dashboard alert cards.

---

## Data Schema & API Contract

### Alert Data Interface (`AlertItem`)
```typescript
export interface AlertItem {
  id: string;
  userId: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  expiresAt: string;
  createdAt: string;
}
```

---

## System Architecture & Components

```
+-----------------------------------------------------------------------+
|                             FRONTEND                                  |
|                                                                       |
|   BoltzHeader                                  DashboardPage          |
|        |                                            |                 |
|   NotificationPopover                          AlertCards             |
|        \                                            /                 |
|         +---------------> useAlerts() <------------+                  |
|                               |                                       |
|                         alerts.api.ts                                 |
+-------------------------------+---------------------------------------+
                                |  GET /alerts (triggers evaluate)
                                v
+-----------------------------------------------------------------------+
|                             BACKEND                                   |
|                                                                       |
|                          AlertsController                             |
|                               |                                       |
|                          AlertsService                                |
|                   (evaluateAlerts & getActiveAlerts)                  |
|                               |                                       |
|                         AlertsRepository                              |
+-----------------------------------------------------------------------+
```

### Components Summary

1. `backend/src/modules/alerts/alerts.service.ts`:
   - Updated `evaluateAlerts` to populate `actionUrl` & `actionLabel` in `upsertAlert`.
   - Updated `getActiveAlerts` to run `evaluateAlerts(userId)` dynamically before returning active alerts.

2. `frontend/src/lib/api/alerts.api.ts` & `frontend/src/hooks/use-alerts.ts`:
   - Ensure `AlertItem` type reflects `actionUrl` and `actionLabel`.

3. `frontend/src/components/layout/notification-popover.tsx` (NEW):
   - Standalone Popover dropdown component with `useAlerts`, `useMarkAlertRead`, `useMarkAllAlertsRead`.

4. `frontend/src/components/layout/boltz-header.tsx`:
   - Integrates `NotificationPopover`.

5. `frontend/src/components/dashboard/alert-cards.tsx`:
   - Enriched with action CTA buttons.

---

## Testing Strategy

1. **Backend Integration Tests**:
   - Verify `evaluateAlerts` generates `GOAL_BEHIND` alert with `actionUrl: '/saving-goals'` and `actionLabel: 'Setor Tabungan'` when actual progress is behind schedule.
   - Verify `GET /alerts` returns evaluated active alerts.
2. **Frontend UI Verification**:
   - Verify clicking notification bell toggles popover.
   - Verify CTA buttons navigate correctly to target routes.
   - Verify marking read reduces unread badge count.
