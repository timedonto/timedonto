import { z } from 'zod'

// =====================================================================
// VALIDATION SCHEMAS (READ-ONLY)
// =====================================================================

export const listSpecialtiesSchema = z.object({
  search: z
    .string()
    .min(1, 'Busca deve ter pelo menos 1 caractere')
    .max(100, 'Busca deve ter no máximo 100 caracteres')
    .trim()
    .optional()
})

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type ListSpecialtiesFilters = z.infer<typeof listSpecialtiesSchema>

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface SpecialtyOutput {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const specialtyIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS (READ-ONLY)
// =====================================================================

export const getSpecialtySchema = specialtyIdSchema

export const listSpecialtiesGlobalSchema = z.object({
  filters: listSpecialtiesSchema.optional()
})

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetSpecialtyInput = z.infer<typeof getSpecialtySchema>
export type ListSpecialtiesGlobalInput = z.infer<typeof listSpecialtiesGlobalSchema>
