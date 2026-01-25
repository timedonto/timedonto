/*
  Warnings:

  - Added the required column `updatedAt` to the `attendance_procedures` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendance_procedures" ADD COLUMN     "clinicalStatus" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dentistId" TEXT,
ADD COLUMN     "faces" TEXT[],
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "procedureId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "procedureCode" DROP NOT NULL;

-- Update existing rows to set timestamps
UPDATE "attendance_procedures" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
UPDATE "attendance_procedures" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

-- Make timestamps NOT NULL after setting defaults
ALTER TABLE "attendance_procedures" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "attendance_procedures" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "attendance_procedures" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "attendance_procedures_procedureId_idx" ON "attendance_procedures"("procedureId");

-- CreateIndex
CREATE INDEX "attendance_procedures_dentistId_idx" ON "attendance_procedures"("dentistId");

-- AddForeignKey
ALTER TABLE "attendance_procedures" ADD CONSTRAINT "attendance_procedures_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_procedures" ADD CONSTRAINT "attendance_procedures_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "dentists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
