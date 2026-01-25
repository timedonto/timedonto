-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('CHECKED_IN', 'IN_PROGRESS', 'DONE', 'CANCELED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ClinicalDocumentType" AS ENUM ('ATESTADO', 'PRESCRICAO', 'EXAME', 'ENCAMINHAMENTO');

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "patientId" TEXT NOT NULL,
    "dentistId" TEXT,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdByRole" "UserRole" NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_cids" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "cidCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "observation" TEXT,
    "createdByDentistId" TEXT NOT NULL,

    CONSTRAINT "attendance_cids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_procedures" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "procedureCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tooth" TEXT,
    "surface" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "attendance_procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_odontograms" (
    "attendanceId" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "attendance_odontograms_pkey" PRIMARY KEY ("attendanceId")
);

-- CreateTable
CREATE TABLE "clinical_documents" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "type" "ClinicalDocumentType" NOT NULL,
    "payload" JSONB NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendances_appointmentId_key" ON "attendances"("appointmentId");

-- CreateIndex
CREATE INDEX "attendances_clinicId_idx" ON "attendances"("clinicId");

-- CreateIndex
CREATE INDEX "attendances_clinicId_status_idx" ON "attendances"("clinicId", "status");

-- CreateIndex
CREATE INDEX "attendances_clinicId_arrivalAt_idx" ON "attendances"("clinicId", "arrivalAt");

-- CreateIndex
CREATE INDEX "attendances_clinicId_patientId_idx" ON "attendances"("clinicId", "patientId");

-- CreateIndex
CREATE INDEX "attendances_clinicId_dentistId_idx" ON "attendances"("clinicId", "dentistId");

-- CreateIndex
CREATE INDEX "attendance_cids_attendanceId_idx" ON "attendance_cids"("attendanceId");

-- CreateIndex
CREATE INDEX "attendance_cids_createdByDentistId_idx" ON "attendance_cids"("createdByDentistId");

-- CreateIndex
CREATE INDEX "attendance_procedures_attendanceId_idx" ON "attendance_procedures"("attendanceId");

-- CreateIndex
CREATE INDEX "clinical_documents_attendanceId_idx" ON "clinical_documents"("attendanceId");

-- CreateIndex
CREATE INDEX "clinical_documents_type_idx" ON "clinical_documents"("type");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "dentists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_cids" ADD CONSTRAINT "attendance_cids_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_cids" ADD CONSTRAINT "attendance_cids_createdByDentistId_fkey" FOREIGN KEY ("createdByDentistId") REFERENCES "dentists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_procedures" ADD CONSTRAINT "attendance_procedures_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_odontograms" ADD CONSTRAINT "attendance_odontograms_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_documents" ADD CONSTRAINT "clinical_documents_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
