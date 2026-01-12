import { z } from 'zod'

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createPatientSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z
    .string()
    .email('Email deve ter um formato válido')
    .toLowerCase()
    .trim()
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .trim()
    .nullable()
    .optional(),
  cpf: z
    .string()
    .max(14, 'CPF deve ter no máximo 14 caracteres')
    .trim()
    .nullable()
    .optional(),
  birthDate: z
    .string()
    .datetime('Data de nascimento deve ser uma data ISO válida')
    .nullable()
    .optional(),
  address: z
    .string()
    .max(500, 'Endereço deve ter no máximo 500 caracteres')
    .trim()
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .nullable()
    .optional()
})

export const updatePatientSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Email deve ter um formato válido')
    .toLowerCase()
    .trim()
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .trim()
    .nullable()
    .optional(),
  cpf: z
    .string()
    .max(14, 'CPF deve ter no máximo 14 caracteres')
    .trim()
    .nullable()
    .optional(),
  birthDate: z
    .string()
    .datetime('Data de nascimento deve ser uma data ISO válida')
    .nullable()
    .optional(),
  address: z
    .string()
    .max(500, 'Endereço deve ter no máximo 500 caracteres')
    .trim()
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .nullable()
    .optional(),
  isActive: z.boolean().optional()
})

export const listPatientsSchema = z.object({
  search: z
    .string()
    .min(1, 'Busca deve ter pelo menos 1 caractere')
    .max(100, 'Busca deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  isActive: z.boolean().optional()
})

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
export type ListPatientsInput = z.infer<typeof listPatientsSchema>

// Export aliases as requested
export type CreatePatientData = CreatePatientInput
export type UpdatePatientData = UpdatePatientInput
export type ListPatientsFilters = ListPatientsInput

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface PatientOutput {
  id: string
  clinicId: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  birthDate: Date | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const patientIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getPatientSchema = patientIdSchema

export const deletePatientSchema = patientIdSchema

export const updatePatientWithIdSchema = patientIdSchema.merge(
  z.object({
    data: updatePatientSchema
  })
)

export const createPatientWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createPatientSchema
  })
)

export const listPatientsWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listPatientsSchema.optional()
  })
)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetPatientInput = z.infer<typeof getPatientSchema>
export type DeletePatientInput = z.infer<typeof deletePatientSchema>
export type UpdatePatientWithIdInput = z.infer<typeof updatePatientWithIdSchema>
export type CreatePatientWithClinicInput = z.infer<typeof createPatientWithClinicSchema>
export type ListPatientsWithClinicInput = z.infer<typeof listPatientsWithClinicSchema>