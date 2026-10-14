-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('DRAFT', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchOrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'INSUFFICIENT_BALANCE');

-- CreateEnum
CREATE TYPE "CreditPeriodType" AS ENUM ('TERM', 'SESSION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'BATCH_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'BATCH_CONFIRMED';
ALTER TYPE "AuditAction" ADD VALUE 'BATCH_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_DEACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE 'CREDIT_LIMIT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'PERIOD_RESET';

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "creditPeriodMaxAmount" DECIMAL(12,2),
ADD COLUMN     "creditPeriodType" "CreditPeriodType",
ADD COLUMN     "currentPeriodStartedAt" TIMESTAMP(3),
ADD COLUMN     "dailySpendMaxAmount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "house" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetCodeHash" TEXT,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'DRAFT',
    "label" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "duplicatedFromId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchOrder" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "BatchOrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customReason" TEXT,
    "failureReason" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchOrderItem" (
    "id" TEXT NOT NULL,
    "batchOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "priceSnapshot" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_schoolId_isActive_idx" ON "Product"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "Batch_schoolId_status_idx" ON "Batch"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Batch_createdById_idx" ON "Batch"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "BatchOrder_transactionId_key" ON "BatchOrder"("transactionId");

-- CreateIndex
CREATE INDEX "BatchOrder_batchId_idx" ON "BatchOrder"("batchId");

-- CreateIndex
CREATE INDEX "BatchOrder_studentId_idx" ON "BatchOrder"("studentId");

-- CreateIndex
CREATE INDEX "BatchOrder_status_idx" ON "BatchOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BatchOrder_batchId_studentId_key" ON "BatchOrder"("batchId", "studentId");

-- CreateIndex
CREATE INDEX "BatchOrderItem_batchOrderId_idx" ON "BatchOrderItem"("batchOrderId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_duplicatedFromId_fkey" FOREIGN KEY ("duplicatedFromId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrder" ADD CONSTRAINT "BatchOrder_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrder" ADD CONSTRAINT "BatchOrder_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrder" ADD CONSTRAINT "BatchOrder_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrderItem" ADD CONSTRAINT "BatchOrderItem_batchOrderId_fkey" FOREIGN KEY ("batchOrderId") REFERENCES "BatchOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrderItem" ADD CONSTRAINT "BatchOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
