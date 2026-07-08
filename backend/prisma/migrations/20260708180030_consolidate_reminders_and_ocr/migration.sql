-- AlterTable
ALTER TABLE "recurring_transactions" ADD COLUMN     "lastNotifiedDate" TIMESTAMP(3),
ADD COLUMN     "notifyBeforeDays" INTEGER;

-- CreateTable
CREATE TABLE "ocr_receipts" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "description" TEXT,
    "result" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ocr_receipts_userId_status_idx" ON "ocr_receipts"("userId", "status");

-- AddForeignKey
ALTER TABLE "ocr_receipts" ADD CONSTRAINT "ocr_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
