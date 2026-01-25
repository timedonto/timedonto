-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "treatment_plans" ADD COLUMN     "discountType" "DiscountType",
ADD COLUMN     "discountValue" DECIMAL(10,2),
ADD COLUMN     "finalAmount" DECIMAL(10,2) DEFAULT 0;

-- AlterTable
ALTER TABLE "treatment_items" ADD COLUMN     "procedureId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "originalAmount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "discountType" "DiscountType",
ADD COLUMN     "discountValue" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "treatment_items_procedureId_idx" ON "treatment_items"("procedureId");

-- AddForeignKey
ALTER TABLE "treatment_items" ADD CONSTRAINT "treatment_items_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing records: set finalAmount = totalAmount for existing treatment_plans
UPDATE "treatment_plans" SET "finalAmount" = "totalAmount" WHERE "finalAmount" = 0;

-- Update existing records: set originalAmount = amount for existing payments
UPDATE "payments" SET "originalAmount" = "amount" WHERE "originalAmount" = 0;
