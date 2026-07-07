# Task 1 Brief: Database Migration

## Task Description

Tambahkan 4 model baru ke Prisma schema untuk fitur Smart Alerts dan AI Advisor.

**Files to modify:**
- `backend/prisma/schema.prisma` — tambah 4 model baru + relasi ke User

## Global Constraints

- Commit setelah task selesai dengan message: `feat(db): add alerts, ai_chat_sessions, ai_chat_messages, ai_insights tables`
- Backend: NestJS + Prisma (PostgreSQL)
- Jalankan `npx prisma migrate dev` setelah modifikasi schema
- Working directory: `c:\Users\ssatyaji\Desktop\development\money-management-v2`

## Steps

### Step 1: Tambah 4 model ke `backend/prisma/schema.prisma`

Buka file `backend/prisma/schema.prisma`. Tambahkan di bagian **bawah file** setelah model terakhir:

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

### Step 2: Tambah relasi ke model `User`

Cari model `User` yang sudah ada di `schema.prisma`. Tambahkan 3 field relasi baru di dalam blok model tersebut:

```prisma
  alerts         Alert[]
  aiChatSessions AiChatSession[]
  aiInsights     AiInsight[]
```

### Step 3: Jalankan migration

```bash
cd backend
npx prisma migrate dev --name add_alerts_and_ai_tables
```

Expected output: `The following migration(s) have been applied: .../add_alerts_and_ai_tables`

### Step 4: Generate Prisma client

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`

### Step 5: Commit

```bash
git add backend/prisma/
git commit -m "feat(db): add alerts, ai_chat_sessions, ai_chat_messages, ai_insights tables"
```

## Verification

Pastikan migration berhasil tanpa error. Cek dengan:
```bash
npx prisma studio
```
Atau cukup pastikan `npx prisma generate` sukses tanpa error TypeScript.
