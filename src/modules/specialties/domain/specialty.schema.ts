import { z } from 'zod'

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createSpecialtySchema = z.object({
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
  isActive: z
    .boolean()
    .default(true)
    .optional()
})

export const updateSpecialtySchema = z.object({
  id: z
    .string()
    .cuid('ID deve ser um CUID válido'),
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
  isActive: z
    .boolean()
    .optional()
})

export const listSpecialtiesSchema = z.object({
  search: z
    .string()
    .min(1, 'Busca deve ter pelo menos 1 caractere')
    .max(100, 'Busca deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  isActive: z
    .boolean()
    .optional()
})

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type CreateSpecialtyData = z.infer<typeof createSpecialtySchema>
export type UpdateSpecialtyData = z.infer<typeof updateSpecialtySchema>
export type ListSpecialtiesFilters = z.infer<typeof listSpecialtiesSchema>

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface SpecialtyOutput {
  id: string
  clinicId: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const specialtyIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getSpecialtySchema = specialtyIdSchema

export const deleteSpecialtySchema = specialtyIdSchema

export const updateSpecialtyWithIdSchema = specialtyIdSchema.merge(
  z.object({
    data: updateSpecialtySchema.omit({ id: true })
  })
)

export const createSpecialtyWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createSpecialtySchema
  })
)

export const listSpecialtiesWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listSpecialtiesSchema.optional()
  })
)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetSpecialtyInput = z.infer<typeof getSpecialtySchema>
export type DeleteSpecialtyInput = z.infer<typeof deleteSpecialtySchema>
export type UpdateSpecialtyWithIdInput = z.infer<typeof updateSpecialtyWithIdSchema>
export type CreateSpecialtyWithClinicInput = z.infer<typeof createSpecialtyWithClinicSchema>
export type ListSpecialtiesWithClinicInput = z.infer<typeof listSpecialtiesWithClinicSchema>
