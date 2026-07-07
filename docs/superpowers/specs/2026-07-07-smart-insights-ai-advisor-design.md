# Design Spec: Smart Dashboard + AI Financial Advisor

**Date:** 2026-07-07
**Status:** Draft — Pending User Approval
**Scope:** Approach A — tiga fitur baru yang saling terhubung
**Target User:** Personal use / keluarga kecil

---

## 1. Latar Belakang

Dua pain point utama yang diidentifikasi:
1. **Insight kurang informatif** — User tidak tahu proaktif apa yang perlu diperhatikan
2. **Susah planning ke depan** — Tidak ada estimasi saldo akhir bulan

Solusi (tiga fitur satu narasi):
- **Fitur 1:** "Sisa Uang" Predictor
- **Fitur 2:** Smart Alerts Engine
- **Fitur 3:** AI Financial Advisor (Gemini)

---

## 2. Architecture Overview

Frontend (Next.js):
- /dashboard  <- "Sisa Uang" Widget
- /dashboard  <- Smart Alert Cards
- /ai-advisor -> AI Chat + Insight Cards
- /debts, /goals, /investments <- "Tanya AI" contextual button

Backend (NestJS):
- [EXTEND] reports.module + GET /reports/month-predictor
- [NEW] alerts.module (rules engine, cron 6h, Redis cache 1h)
- [NEW] ai-advisor.module (Gemini SDK, cron weekly insights)

Database: PostgreSQL + Redis (existing)

Prinsip: tidak ada breaking change ke modul yang sudah ada.

---

## 3. Fitur 1: "Sisa Uang" Predictor

Kalkulasi:
  Estimasi Saldo Akhir Bulan =
    Saldo sekarang (sum semua wallet)
    + Pemasukan recurring yang belum terjadi bulan ini
    - Pengeluaran recurring yang belum terjadi bulan ini
    - (Avg pengeluaran harian 30 hari terakhir x sisa hari bulan ini)

Status:
- SAFE   : estimasi > 20% dari pemasukan bulan ini (hijau)
- CAUTION: estimasi 5-20% (kuning)
- DANGER : estimasi < 5% atau negatif (merah)

API:
  GET /reports/month-predictor
  Response: { currentBalance, projectedIncome, projectedExpense,
              estimatedEndBalance, safeToSpend, daysRemaining,
              status, breakdown }

Frontend:
- Widget di dashboard: angka besar + badge status + link ke cashflow forecast

---

## 4. Fitur 2: Smart Alerts Engine

Rules (6):
| ID              | Trigger                                      | Severity |
|-----------------|----------------------------------------------|----------|
| BUDGET_OVERRUN  | Spending kategori > 80% budget bulan ini     | WARNING  |
| SPENDING_SPIKE  | Kategori bulan ini > 130% avg 3 bulan lalu   | WARNING  |
| DEBT_DUE        | Utang jatuh tempo <= 7 hari                  | DANGER   |
| GOAL_BEHIND     | Progress goal < expected pace                | INFO     |
| LOW_BALANCE     | Estimasi akhir bulan < 5% dari pemasukan     | DANGER   |
| POSITIVE_STREAK | Surplus 3 bulan berturut-turut               | SUCCESS  |

Cron: evaluasi setiap 6 jam, simpan ke tabel alerts.
Redis: cache alerts:{userId} expire 1 jam, invalidate saat mark-as-read.

API:
  GET    /alerts
  PATCH  /alerts/:id/read
  PATCH  /alerts/read-all
  POST   /alerts/refresh (rate limited: 1x/10 menit)

Frontend:
- Alert cards di atas dashboard (max 3, sisanya /alerts)
- Badge merah di navbar jika ada yang belum dibaca

---

## 5. Fitur 3: AI Financial Advisor

LLM: Google Gemini (@google/generative-ai)
Config: GEMINI_API_KEY di .env backend

Data context yang di-inject ke setiap prompt:
- currentBalance (semua wallet)
- monthlyIncome, monthlyExpense
- topCategories (top 5 pengeluaran)
- activeBudgets (budget + % usage)
- activeGoals (goals + % progress)
- upcomingDebts (jatuh tempo 14 hari ke depan)
- activeAlerts
- estimatedEndBalance

System prompt: Bahasa Indonesia, actionable, max 3 paragraf, tanpa rekomendasi produk luar.

Weekly Insight Cards:
- Cron Senin 07.00 WIB
- Generate 3 kartu per user aktif (login < 30 hari)
- Simpan ke ai_insights, expire 7 hari

Chat Sessions:
- Context-aware: klik "Tanya AI" di /debts buka chat dengan context DEBT + debtId
- History simpan di DB untuk UI, stateless per LLM request (hemat token)

API:
  GET  /ai-advisor/insights
  POST /ai-advisor/sessions
  GET  /ai-advisor/sessions/:id
  POST /ai-advisor/sessions/:id/messages
  POST /ai-advisor/insights/generate (internal/cron)

Frontend /ai-advisor:
- Panel atas: 3 insight cards + tombol "Tanya lebih lanjut"
- Panel bawah: chat interface + suggested questions

---

## 6. Data Model (Prisma Additions)

model Alert {
  id, userId, type, title, message, metadata(Json?),
  isRead(false), severity, createdAt, expiresAt
  @@index([userId, isRead])
  @@map("alerts")
}

model AiChatSession {
  id, userId, context?, contextId?, messages[], createdAt, updatedAt
  @@map("ai_chat_sessions")
}

model AiChatMessage {
  id, sessionId, role(user|assistant), content, createdAt
  @@map("ai_chat_messages")
}

model AiInsight {
  id, userId, title, body, actionLabel?, actionUrl?,
  isRead(false), generatedAt, expiresAt
  @@map("ai_insights")
}

---

## 7. Implementation Order

1. Database migration (4 tabel baru)
2. Fitur 1: Month Predictor (backend extend + frontend widget)
3. Fitur 2: Smart Alerts (backend module + cron + frontend cards)
4. Fitur 3: AI Advisor (backend module + Gemini + chat UI)

Estimasi: 3-5 hari kerja

---

## 8. Verification Plan

Automated:
- Unit test tiap rule di AlertsService
- Unit test kalkulasi month predictor
- Integration test AI advisor endpoint (mock Gemini)

Manual:
- Verifikasi month predictor akurat
- Trigger tiap alert rule, konfirmasi muncul di UI
- Chat dengan AI, cek response relevan
- Cek insight cards via cron trigger manual
