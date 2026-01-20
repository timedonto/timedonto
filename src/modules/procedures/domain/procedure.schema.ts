import { z } from 'zod'

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createProcedureSchema = z.object({
  specialtyId: z
    .string()
    .cuid('ID da especialidade deve ser um CUID válido'),
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional()
    .nullable(),
  baseValue: z.number({ coerce: true }).min(0, 'Valor base deve ser maior ou igual a 0'),
  commissionPercentage: z
    .number({ coerce: true })
    .min(0, 'Comissão deve ser maior ou igual a 0')
    .max(100, 'Comissão deve ser menor ou igual a 100'),
  isActive: z
    .boolean()
    .default(true)
    .optional()
})

export const updateProcedureSchema = z.object({
  id: z
    .string()
    .cuid('ID deve ser um CUID válido'),
  specialtyId: z
    .string()
    .cuid('ID da especialidade deve ser um CUID válido')
    .optional(),
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional()
    .nullable(),
  baseValue: z.number({ coerce: true }).min(0).optional(),
  commissionPercentage: z.number({ coerce: true }).min(0).max(100).optional(),
  isActive: z
    .boolean()
    .optional()
})

export const listProceduresSchema = z.object({
  specialtyId: z.string().cuid().optional(),
  search: z
    .string()
    .trim()
    .optional(),
  isActive: z
    .boolean()
    .optional()
})

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type CreateProcedureData = z.infer<typeof createProcedureSchema>
export type UpdateProcedureData = z.infer<typeof updateProcedureSchema>
export type ListProceduresFilters = z.infer<typeof listProceduresSchema>

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface ProcedureOutput {
  id: string
  clinicId: string
  specialtyId: string
  name: string
  description: string | null
  baseValue: number
  commissionPercentage: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  specialty?: {
    id: string
    name: string
  }
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const procedureIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getProcedureSchema = procedureIdSchema

export const deleteProcedureSchema = procedureIdSchema

export const updateProcedureWithIdSchema = procedureIdSchema.merge(
  z.object({
    data: updateProcedureSchema.omit({ id: true })
  })
)

export const createProcedureWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createProcedureSchema
  })
)

export const listProceduresWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listProceduresSchema.optional()
  })
)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetProcedureInput = z.infer<typeof getProcedureSchema>
export type DeleteProcedureInput = z.infer<typeof deleteProcedureSchema>
export type UpdateProcedureWithIdInput = z.infer<typeof updateProcedureWithIdSchema>
export type CreateProcedureWithClinicInput = z.infer<typeof createProcedureWithClinicSchema>
export type ListProceduresWithClinicInput = z.infer<typeof listProceduresWithClinicSchema>
