import { z } from 'zod'

// =====================================================================
// ENUMS
// =====================================================================

export const InventoryMovementTypeEnum = z.enum(['IN', 'OUT'])

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createInventoryMovementSchema = z.object({
  itemId: z
    .string()
    .cuid('ID do item deve ser um CUID válido'),
  type: InventoryMovementTypeEnum,
  quantity: z
    .number()
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade deve ser maior que 0'),
  appointmentId: z
    .string()
    .cuid('ID do agendamento deve ser um CUID válido')
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .nullable()
    .optional()
})

export const listInventoryMovementsSchema = z.object({
  itemId: z
    .string()
    .cuid('ID do item deve ser um CUID válido')
    .optional(),
  type: InventoryMovementTypeEnum.optional(),
  from: z
    .string()
    .datetime('Data inicial deve ser uma data ISO válida')
    .optional(),
  to: z
    .string()
    .datetime('Data final deve ser uma data ISO válida')
    .optional()
})

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type CreateInventoryMovementInput = z.infer<typeof createInventoryMovementSchema>
export type ListInventoryMovementsInput = z.infer<typeof listInventoryMovementsSchema>
export type InventoryMovementType = z.infer<typeof InventoryMovementTypeEnum>

// Export aliases as requested
export type CreateInventoryMovementData = CreateInventoryMovementInput
export type ListInventoryMovementsFilters = ListInventoryMovementsInput

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface InventoryMovementOutput {
  id: string
  clinicId: string
  itemId: string
  type: InventoryMovementType
  quantity: number
  appointmentId: string | null
  createdById: string
  notes: string | null
  createdAt: Date
  // Relacionamentos opcionais para joins
  item?: {
    id: string
    name: string
    unit: string
  }
  appointment?: {
    id: string
    date: Date
    procedure: string | null
  }
  createdBy?: {
    id: string
    name: string
  }
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const inventoryMovementIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

export const itemIdSchema = z.object({
  itemId: z.string().cuid('ID do item deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getInventoryMovementSchema = inventoryMovementIdSchema

export const createInventoryMovementWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createInventoryMovementSchema
  })
)

export const listInventoryMovementsWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listInventoryMovementsSchema.optional()
  })
)

export const listMovementsByItemSchema = clinicIdSchema.merge(
  itemIdSchema.merge(
    z.object({
      filters: listInventoryMovementsSchema.optional()
    })
  )
)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetInventoryMovementInput = z.infer<typeof getInventoryMovementSchema>
export type CreateInventoryMovementWithClinicInput = z.infer<typeof createInventoryMovementWithClinicSchema>
export type ListInventoryMovementsWithClinicInput = z.infer<typeof listInventoryMovementsWithClinicSchema>
export type ListMovementsByItemInput = z.infer<typeof listMovementsByItemSchema>

// =====================================================================
// BUSINESS LOGIC SCHEMAS
// =====================================================================

// Schema para movimentação de entrada (IN)
export const createInMovementSchema = createInventoryMovementSchema.extend({
  type: z.literal('IN')
})

// Schema para movimentação de saída (OUT)
export const createOutMovementSchema = createInventoryMovementSchema.extend({
  type: z.literal('OUT')
})

// Schema para movimentação vinculada a agendamento (sempre OUT)
export const createAppointmentMovementSchema = createInventoryMovementSchema.extend({
  type: z.literal('OUT'),
  appointmentId: z.string().cuid('ID do agendamento é obrigatório')
})

export type CreateInMovementInput = z.infer<typeof createInMovementSchema>
export type CreateOutMovementInput = z.infer<typeof createOutMovementSchema>
export type CreateAppointmentMovementInput = z.infer<typeof createAppointmentMovementSchema>