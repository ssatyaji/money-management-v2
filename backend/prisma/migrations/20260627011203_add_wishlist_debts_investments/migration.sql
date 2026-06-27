-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('SAVE_UP', 'PAY_OFF');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('RECEIVABLE', 'PAYABLE');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('ACTIVE', 'PARTIALLY_PAID', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('STOCK', 'GOLD', 'CRYPTO', 'MUTUAL_FUND', 'BOND', 'DEPOSIT', 'PROPERTY', 'OTHER');

-- CreateTable
CREATE TABLE "saving_goals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT '🎯',
    "color" TEXT DEFAULT '#6366f1',
    "goalType" "GoalType" NOT NULL,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "currentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "monthlyTarget" DECIMAL(15,2),
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saving_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_contributions" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "personContact" TEXT,
    "description" TEXT,
    "type" "DebtType" NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "DebtStatus" NOT NULL DEFAULT 'ACTIVE',
    "dueDate" TIMESTAMP(3),
    "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debtId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ticker" TEXT,
    "assetType" "AssetType" NOT NULL,
    "icon" TEXT DEFAULT '📈',
    "color" TEXT DEFAULT '#8b5cf6',
    "totalUnits" DECIMAL(18,8) NOT NULL,
    "avgBuyPrice" DECIMAL(15,2) NOT NULL,
    "currentPrice" DECIMAL(15,2) NOT NULL,
    "currentPriceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalInvested" DECIMAL(15,2) NOT NULL,
    "currentValue" DECIMAL(15,2) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_transactions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "units" DECIMAL(18,8) NOT NULL,
    "pricePerUnit" DECIMAL(15,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saving_goals_userId_status_idx" ON "saving_goals"("userId", "status");

-- CreateIndex
CREATE INDEX "goal_contributions_goalId_date_idx" ON "goal_contributions"("goalId", "date");

-- CreateIndex
CREATE INDEX "debts_userId_status_idx" ON "debts"("userId", "status");

-- CreateIndex
CREATE INDEX "debts_userId_type_idx" ON "debts"("userId", "type");

-- CreateIndex
CREATE INDEX "debt_payments_debtId_date_idx" ON "debt_payments"("debtId", "date");

-- CreateIndex
CREATE INDEX "investment_assets_userId_assetType_idx" ON "investment_assets"("userId", "assetType");

-- CreateIndex
CREATE UNIQUE INDEX "investment_assets_userId_name_assetType_key" ON "investment_assets"("userId", "name", "assetType");

-- CreateIndex
CREATE INDEX "investment_transactions_assetId_date_idx" ON "investment_transactions"("assetId", "date");

-- AddForeignKey
ALTER TABLE "saving_goals" ADD CONSTRAINT "saving_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "saving_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_assets" ADD CONSTRAINT "investment_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_transactions" ADD CONSTRAINT "investment_transactions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "investment_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
