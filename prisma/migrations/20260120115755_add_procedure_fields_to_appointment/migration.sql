-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "procedureId" TEXT,
ADD COLUMN     "procedureSnapshot" JSONB;

-- CreateTable
CREATE TABLE "dentist_procedures" (
    "id" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dentist_procedures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dentist_procedures_dentistId_idx" ON "dentist_procedures"("dentistId");

-- CreateIndex
CREATE INDEX "dentist_procedures_procedureId_idx" ON "dentist_procedures"("procedureId");

-- CreateIndex
CREATE UNIQUE INDEX "dentist_procedures_dentistId_procedureId_key" ON "dentist_procedures"("dentistId", "procedureId");

-- CreateIndex
CREATE INDEX "appointments_procedureId_idx" ON "appointments"("procedureId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dentist_procedures" ADD CONSTRAINT "dentist_procedures_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "dentists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dentist_procedures" ADD CONSTRAINT "dentist_procedures_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
