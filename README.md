# 💰 Money Management App

Aplikasi manajemen keuangan pribadi untuk keluarga.

## Tech Stack

### Backend
- NestJS + TypeScript
- PostgreSQL + Prisma ORM
- Passport JWT Authentication
- Swagger API Documentation

### Frontend
- Next.js 15 + TypeScript
- Tailwind CSS + Shadcn UI
- TanStack Query (React Query)
- Recharts (Charts)

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### 1. Start Database & Redis
```bash
docker-compose up -d
```

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```
Backend runs at `http://localhost:3001`
Swagger docs at `http://localhost:3001/api/docs`

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`

## API Endpoints

### Auth
- `POST /api/v1/auth/register` — Register
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/refresh` — Refresh token
- `POST /api/v1/auth/logout` — Logout
- `GET /api/v1/auth/me` — Current user

### Categories
- `GET /api/v1/categories` — List categories
- `POST /api/v1/categories` — Create category
- `PATCH /api/v1/categories/:id` — Update category
- `DELETE /api/v1/categories/:id` — Delete category

### Transactions
- `GET /api/v1/transactions` — List with filters
- `POST /api/v1/transactions` — Create transaction
- `GET /api/v1/transactions/summary` — Monthly summary
- `GET /api/v1/transactions/category-breakdown` — Category breakdown
- `GET /api/v1/transactions/daily-trend` — Daily trend
- `GET /api/v1/transactions/recent` — Recent transactions
- `PATCH /api/v1/transactions/:id` — Update
- `DELETE /api/v1/transactions/:id` — Delete

### Users (Admin)
- `GET /api/v1/users` — List users
- `PATCH /api/v1/users/:id` — Update user
- `DELETE /api/v1/users/:id` — Delete user

## Features Progress
- ✅ Login & Registration (JWT + refresh token)
- ✅ Dashboard with charts (Recharts)
- ✅ Income & Expense tracking (CRUD + filters)
- ✅ Category management
- 🔜 Budget management
- 🔜 Monthly & Yearly reports
- 🔜 Bill reminders
- 🔜 Receipt OCR scanning
- 🔜 Bank e-statement import
- 🔜 Role-based access (Admin)
- 🔜 Progressive Web App (PWA)
