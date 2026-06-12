-- AlterTable
ALTER TABLE "users" ADD COLUMN     "financialGoal" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "monthlyIncome" DECIMAL(15,2),
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_verifications_email_code_idx" ON "otp_verifications"("email", "code");
