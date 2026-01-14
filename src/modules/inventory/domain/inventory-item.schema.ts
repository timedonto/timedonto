import { z } from 'zod'

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createInventoryItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .nullable()
    .optional(),
  unit: z
    .string()
    .min(1, 'Unidade é obrigatória')
    .max(20, 'Unidade deve ter no máximo 20 caracteres')
    .trim(),
  currentQuantity: z
    .number()
    .int('Quantidade atual deve ser um número inteiro')
    .min(0, 'Quantidade atual deve ser maior ou igual a 0')
    .default(0),
  minQuantity: z
    .number()
    .int('Quantidade mínima deve ser um número inteiro')
    .min(0, 'Quantidade mínima deve ser maior ou igual a 0')
    .nullable()
    .optional()
})

export const updateInventoryItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .nullable()
    .optional(),
  unit: z
    .string()
    .min(1, 'Unidade é obrigatória')
    .max(20, 'Unidade deve ter no máximo 20 caracteres')
    .trim()
    .optional(),
  currentQuantity: z
    .number()
    .int('Quantidade atual deve ser um número inteiro')
    .min(0, 'Quantidade atual deve ser maior ou igual a 0')
    .optional(),
  minQuantity: z
    .number()
    .int('Quantidade mínima deve ser um número inteiro')
    .min(0, 'Quantidade mínima deve ser maior ou igual a 0')
    .nullable()
    .optional(),
  isActive: z.boolean().optional()
})

export const listInventoryItemsSchema = z.object({
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

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>
export type ListInventoryItemsInput = z.infer<typeof listInventoryItemsSchema>

// Export aliases as requested
export type CreateInventoryItemData = CreateInventoryItemInput
export type UpdateInventoryItemData = UpdateInventoryItemInput
export type ListInventoryItemsFilters = ListInventoryItemsInput

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface InventoryItemOutput {
  id: string
  clinicId: string
  name: string
  description: string | null
  unit: string
  currentQuantity: number
  minQuantity: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const inventoryItemIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getInventoryItemSchema = inventoryItemIdSchema

export const deleteInventoryItemSchema = inventoryItemIdSchema

export const updateInventoryItemWithIdSchema = inventoryItemIdSchema.merge(
  z.object({
    data: updateInventoryItemSchema
  })
)

export const createInventoryItemWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createInventoryItemSchema
  })
)

export const listInventoryItemsWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listInventoryItemsSchema.optional()
  })
)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetInventoryItemInput = z.infer<typeof getInventoryItemSchema>
export type DeleteInventoryItemInput = z.infer<typeof deleteInventoryItemSchema>
export type UpdateInventoryItemWithIdInput = z.infer<typeof updateInventoryItemWithIdSchema>
export type CreateInventoryItemWithClinicInput = z.infer<typeof createInventoryItemWithClinicSchema>
export type ListInventoryItemsWithClinicInput = z.infer<typeof listInventoryItemsWithClinicSchema>