/*
  Warnings:

  - A unique constraint covering the columns `[attendanceId]` on the table `records` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "records" ADD COLUMN     "attendanceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "records_attendanceId_key" ON "records"("attendanceId");

-- CreateIndex
CREATE INDEX "records_attendanceId_idx" ON "records"("attendanceId");

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
