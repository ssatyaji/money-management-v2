# Design Spec: Desktop Dashboard Redesign (ZARO SaaS Pattern)

**Date**: 2026-07-22  
**Status**: Approved  
**Target App**: Zayn Finance (`money-management-v2`)  

---

## 1. Overview & Objective

Redesign the desktop view of the main dashboard (`/dashboard`) in Zayn Finance to adopt a high-end, modern SaaS layout pattern inspired by the ZARO dashboard style. 

The goal is to elevate visual aesthetics, readability, and information density on desktop screens while preserving responsive mobile navigation.

---

## 2. Layout & Architectural Component Breakdown

### A. Left Dark Navy Sidebar (`lg:flex`)
- **Container**: Fixed width (`w-64`), dark navy background (`bg-[#0f172a]` in light mode, `dark:bg-[#090d16]`), text-white.
- **Brand Header**: Logo "Zayn Finance" with vibrant emerald icon and subtitle.
- **Navigation Links**:
  - Dashboard (Active state with gradient highlight `bg-indigo-600/80` or `bg-emerald-600/80` + glow)
  - Transaksi (`/transactions`)
  - Anggaran (`/budgets`)
  - Target Tabungan (`/goals`)
  - Utang & Piutang (`/debts`)
  - Investasi (`/investments`)
  - Laporan (`/reports/monthly`)
  - AI Advisor (`/ai-advisor`)
  - Pengaturan (`/settings`)
- **Help Card Widget**: Sleek bottom card with "Butuh Bantuan?" link to AI Advisor or FAQ.
- **User Profile Pill**: Bottom user avatar + name + role badge.

### B. Top Header Bar
- **Search Command Bar**: Input trigger (`Cari transaksi... ⌘K`) opening search modal or navigating to transactions search.
- **Quick Action Button**: `+ Transaksi` quick modal trigger.
- **Notification Bell**: Notification icon with unread count badge.
- **User Avatar**: Profile dropdown menu.

### C. Main Dashboard Canvas Grid
1. **Top KPI Stat Cards (4 Cards Grid)**:
   - *Total Saldo Utama* (With sparkline SVG & % change)
   - *Pemasukan Bulan Ini* (With sparkline SVG & % vs last month)
   - *Total Pengeluaran* (With sparkline SVG & % vs last month)
   - *Tingkat Tabungan (Saving Rate %)* (With sparkline SVG & status badge)
2. **Main Charts Section (2 Columns Grid)**:
   - *Left (60% width)*: **Arus Kas Bulanan** (Smooth Recharts AreaChart with purple/emerald gradient fill).
   - *Right (40% width)*: **Pengeluaran per Anggaran** (Recharts BarChart with rounded vertical bars).
3. **Bottom Widgets Section (3 Columns Grid)**:
   - *Left Column*: **Transaksi Terkini** (Table view with icon, category badge, amount, status badge).
   - *Center Column*: **Kategori Pengeluaran** (Recharts PieChart/DonutChart with central total sum & legend).
   - *Right Column*: **Kesehatan Finansial & Akun** (Progress bars for Accounts, Saving Goals, and Debt status).

---

## 3. Data Integration & Custom Hooks

The redesigned dashboard will consume existing hooks:
- `useTransactionSummary(month, year)`
- `useCategoryBreakdown(month, year)`
- `useDailyTrend(month, year)`
- `useRecentTransactions(limit)`
- `useAccounts()`
- `useCashflowForecast()`
- `useSavingGoalSummary()`
- `useDebtSummary()`
- `usePortfolioSummary()`

---

## 4. Verification & Quality Assurance

- **Responsive Breakpoints**: Verified clean layout transition between mobile (`< lg:`) and desktop (`lg:` and `xl:`).
- **TypeScript & Build Check**: Zero lint/type errors on `npm run build`.
- **Unit & Component Testing**: Verify all stat calculations and chart rendering without crashes.
