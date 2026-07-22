# Design Spec: Boltz-Style Dashboard Revamp (Light & Dark Mode)

**Date**: 2026-07-22  
**Status**: Approved by User  
**Target App**: Zayn Finance (`money-management-v2`)  

---

## 1. Executive Summary & Objective

Revamp the dashboard of **Zayn Finance** to match the **Boltz UI** aesthetic pattern. 
The new design features a clean off-white background canvas (`#f8fafc`), bright white floating cards with soft shadows, a light/dark adaptive sidebar, 4 circular-icon stat cards, a multi-ring arc chart, a double smooth line chart, a 4-card colorful credit-card styled wallet carousel, and a recent transactions table with period filter tabs. 

Full support for both **Light Mode** and **Dark Mode** with smooth theme transitions is strictly required.

---

## 2. Color Palette & Typography Specifications

### Typography
- **Font Family**: `Inter`, `Manrope`, sans-serif (Google Fonts loaded in `layout.tsx`).
- **Page Titles**: `text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100`.
- **Card Headings**: `text-base font-bold text-slate-800 dark:text-slate-100`.
- **Primary Amounts**: `text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white`.
- **Secondary Text / Subtitles**: `text-xs font-medium text-slate-500 dark:text-slate-400`.
- **Trend Pills**: `text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full`.

### Color Tokens
| Element | Light Mode | Dark Mode |
|---|---|---|
| **Canvas Background** | `bg-[#f8fafc]` | `dark:bg-[#0b0f17]` |
| **Card Background** | `bg-white border-slate-200/70 shadow-sm hover:shadow-md` | `dark:bg-[#151c2c] dark:border-slate-800/80 dark:shadow-none` |
| **Sidebar Background** | `bg-white border-r border-slate-200/80` | `dark:bg-[#0f172a] dark:border-slate-800/80` |
| **Active Nav Pill** | `bg-blue-50 text-blue-600 font-semibold` | `dark:bg-blue-950/60 dark:text-blue-400 font-semibold` |
| **Header Bar** | `bg-white/80 border-b border-slate-200/80` | `dark:bg-[#0f172a]/80 dark:border-slate-800/80` |

---

## 3. UI Component Architecture & Layout Breakdown

### A. Layout Structure (`layout.tsx`)
- **Desktop Sidebar (`w-64 fixed left-0 top-0 bottom-0 z-40`)**:
  - Adaptive light/dark sidebar.
  - Brand header: Logo "Zayn Finance" with lightning/emerald emblem.
  - User profile snippet at top or bottom.
  - Navigation links: Dashboard, Transaksi, Anggaran, Dompet, Target, Utang, Investasi, Laporan, AI Advisor, Pengaturan.
  - Active item indicator: Soft blue rounded pill (`rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400`).

- **Top Sticky Header Bar**:
  - Left: Global Search Input (`Cari transaksi... ⌘K`) in rounded pill style.
  - Right: Quick Action `+ Tambah Transaksi` (Blue pill button `bg-blue-600 hover:bg-blue-500 text-white rounded-xl`), Weather/Location badge (`🌤️ 21° Jakarta, IDN`), Notification bell, Theme toggle (Light/Dark mode switch).

### B. Dashboard Canvas (`/dashboard/page.tsx`)

1. **Title Row**:
   - Heading "Dashboard"
   - Right Controls: Filter Periode Dropdown pill (`📅 Filter Periode`).

2. **Row 1: 4 Top KPI Stat Cards Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`)**:
   - **Card 1 (Total Saldo)**: Orange circular icon container (`bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400`), bold figure, trend pill `📈 +45% minggu ini`.
   - **Card 2 (Pemasukan Bulan Ini)**: Emerald circular icon container (`bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400`), bold figure, trend pill.
   - **Card 3 (Total Pengeluaran)**: Blue circular icon container (`bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400`), bold figure, trend pill.
   - **Card 4 (Tabungan & Investasi)**: Purple circular icon container (`bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400`), bold figure, trend pill.

3. **Row 2: Middle Charts Grid (`grid-cols-1 lg:grid-cols-12 gap-6`)**:
   - **Left Card (`lg:col-span-4`) - "Statistik Kategori"**:
     - Radial / Semi-circular concentric arc chart showing percentage breakdown of Income, Spends, Installment, Invest.
     - Color-coded dot legend list with exact amounts.
   - **Right Card (`lg:col-span-8`) - "Ringkasan Arus Kas"**:
     - Double smooth area line chart (Blue & Orange lines).
     - Filter checkboxes (Pemasukan, Pengeluaran) & dropdown selector.
     - Hover tooltip pill showing detailed values.

4. **Row 3: 4 Colorful Wallet Credit Cards Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`)**:
   - **Card 1 (Jago / Main)**: Emerald gradient (`bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl p-5 shadow-lg shadow-emerald-500/10 relative overflow-hidden`).
   - **Card 2 (BCA)**: Blue gradient (`bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-2xl p-5 shadow-lg shadow-blue-500/10 relative overflow-hidden`).
   - **Card 3 (SeaBank)**: Purple gradient (`bg-gradient-to-tr from-purple-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg shadow-purple-500/10 relative overflow-hidden`).
   - **Card 4 (Permata / Wallet)**: Orange gradient (`bg-gradient-to-tr from-orange-500 to-amber-600 text-white rounded-2xl p-5 shadow-lg shadow-orange-500/10 relative overflow-hidden`).
   - Includes Account Title, Main Balance figure, Mastercard / chip watermark, Account Number / Expiry date.

5. **Row 4: Bottom Transaction Table (`grid-cols-1 lg:grid-cols-12 gap-6`)**:
   - **Left Card (`lg:col-span-8`) - "Transaksi Terkini"**:
     - Period filter tabs (`Bulanan`, `Mingguan`, `Hari Ini` active blue pill).
     - Table rows with category icon, transaction title, timestamp, amount (`+Rp 550.000`), status badge (`Selesai` green pill).
   - **Right Card (`lg:col-span-4`) - "Target Tabungan & Kesehatan Finansial"**:
     - Progress bars and status pills for active Saving Goals & Debts.

---

## 4. Verification Plan

1. **Visual & Theme Verification**: Test in both Light mode and Dark mode to ensure zero contrast or readability issues.
2. **Responsive Verification**: Ensure smooth scaling across desktop (`lg:`, `xl:`), tablet (`md:`), and mobile (`sm:`).
3. **Build Check**: Run `cd frontend && npm run build` to verify zero TypeScript/JSX errors.
