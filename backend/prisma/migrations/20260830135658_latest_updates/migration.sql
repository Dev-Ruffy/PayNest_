-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'SCHOOL_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE 'SCHOOL_PURGED';

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "pinHash" DROP NOT NULL,
ALTER COLUMN "pinEncrypted" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "School_deletedAt_idx" ON "School"("deletedAt");
