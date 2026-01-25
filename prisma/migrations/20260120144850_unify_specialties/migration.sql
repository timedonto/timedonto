-- CreateTable
CREATE TABLE "dentist_specialties" (
    "id" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dentist_specialties_pkey" PRIMARY KEY ("id")
);

-- Remove existing data from specialties table to avoid conflicts
DELETE FROM "specialties";

-- DropForeignKey
ALTER TABLE "specialties" DROP CONSTRAINT "specialties_clinicId_fkey";

-- DropIndex
DROP INDEX "specialties_clinicId_idx";

-- DropIndex
DROP INDEX "specialties_clinicId_name_idx";

-- AlterTable
ALTER TABLE "specialties" DROP COLUMN "clinicId",
DROP COLUMN "isActive";

-- CreateIndex
CREATE UNIQUE INDEX "specialties_name_key" ON "specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dentist_specialties_dentistId_specialtyId_key" ON "dentist_specialties"("dentistId", "specialtyId");

-- CreateIndex
CREATE INDEX "dentist_specialties_dentistId_idx" ON "dentist_specialties"("dentistId");

-- CreateIndex
CREATE INDEX "dentist_specialties_specialtyId_idx" ON "dentist_specialties"("specialtyId");

-- AddForeignKey
ALTER TABLE "dentist_specialties" ADD CONSTRAINT "dentist_specialties_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "dentists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dentist_specialties" ADD CONSTRAINT "dentist_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert the 23 official dental specialties
INSERT INTO "specialties" ("id", "name", "description", "createdAt", "updatedAt") VALUES
('clzacupuntura001', 'Acupuntura', 'Acupuntura aplicada à odontologia', NOW(), NOW()),
('clzcirurgia002', 'Cirurgia e Traumatologia Bucomaxilofacial', 'Cirurgias da face, boca e estruturas relacionadas', NOW(), NOW()),
('clzdentistica003', 'Dentística', 'Restaurações e procedimentos estéticos dentários', NOW(), NOW()),
('clzdisfuncao004', 'Disfunção Temporomandibular e Dor Orofacial', 'Tratamento de DTM e dores orofaciais', NOW(), NOW()),
('clzendodontia005', 'Endodontia', 'Tratamento de canal e polpa dentária', NOW(), NOW()),
('clzestomatologia006', 'Estomatologia', 'Diagnóstico e tratamento de doenças da boca', NOW(), NOW()),
('clzharmonizacao007', 'Harmonização Orofacial', 'Procedimentos estéticos faciais', NOW(), NOW()),
('clzhomeopatia008', 'Homeopatia', 'Homeopatia aplicada à odontologia', NOW(), NOW()),
('clzimplantodontia009', 'Implantodontia', 'Implantes dentários e reabilitação oral', NOW(), NOW()),
('clzodontogeriatria010', 'Odontogeriatria', 'Odontologia para idosos', NOW(), NOW()),
('clzodontesporte011', 'Odontologia do Esporte', 'Odontologia aplicada ao esporte', NOW(), NOW()),
('clzodontotrabalho012', 'Odontologia do Trabalho', 'Odontologia ocupacional', NOW(), NOW()),
('clzodontolegal013', 'Odontologia Legal', 'Perícia e medicina legal odontológica', NOW(), NOW()),
('clzodontoespeciais014', 'Odontologia para Pacientes com Necessidades Especiais', 'Atendimento a pacientes com necessidades especiais', NOW(), NOW()),
('clzodontopediatria015', 'Odontopediatria', 'Odontologia infantil', NOW(), NOW()),
('clzortodontia016', 'Ortodontia', 'Correção de posicionamento dentário e facial', NOW(), NOW()),
('clzortopedia017', 'Ortopedia Funcional dos Maxilares', 'Correção de crescimento e desenvolvimento facial', NOW(), NOW()),
('clzpatologia018', 'Patologia Oral', 'Diagnóstico de doenças bucais', NOW(), NOW()),
('clzperiodontia019', 'Periodontia', 'Tratamento de gengivas e estruturas de suporte', NOW(), NOW()),
('clzprotesebuco020', 'Prótese Bucomaxilofacial', 'Próteses faciais e bucais', NOW(), NOW()),
('clzprotesedent021', 'Prótese Dentária', 'Próteses dentárias e reabilitação oral', NOW(), NOW()),
('clzradiologia022', 'Radiologia Odontológica e Imaginologia', 'Exames de imagem odontológicos', NOW(), NOW()),
('clzsaudecoletiva023', 'Saúde Coletiva', 'Odontologia em saúde pública', NOW(), NOW());