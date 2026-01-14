import { z } from 'zod'

// =====================================================================
// ENUMS
// =====================================================================

export const PaymentMethodEnum = z.enum(['CASH', 'PIX', 'CARD'])

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createPaymentSchema = z.object({
  amount: z
    .number()
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor deve ser no máximo R$ 999.999,99'),
  method: PaymentMethodEnum,
  patientId: z
    .string()
    .cuid('ID do paciente deve ser um CUID válido')
    .nullable()
    .optional(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .nullable()
    .optional()
})

export const listPaymentsSchema = z.object({
  patientId: z
    .string()
    .cuid('ID do paciente deve ser um CUID válido')
    .optional(),
  method: PaymentMethodEnum.optional(),
  startDate: z
    .string()
    .datetime('Data inicial deve ser uma data ISO válida')
    .optional(),
  endDate: z
    .string()
    .datetime('Data final deve ser uma data ISO válida')
    .optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  {
    message: 'Data inicial deve ser anterior ou igual à data final',
    path: ['endDate']
  }
)

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type ListPaymentsInput = z.infer<typeof listPaymentsSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>

// Export aliases as requested
export type CreatePaymentData = CreatePaymentInput
export type ListPaymentsFilters = ListPaymentsInput

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface PaymentOutput {
  id: string
  clinicId: string
  patientId: string | null
  amount: number
  method: PaymentMethod
  description: string | null
  createdAt: Date
  patient?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const paymentIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getPaymentSchema = paymentIdSchema

export const deletePaymentSchema = paymentIdSchema

export const createPaymentWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createPaymentSchema
  })
)

export const listPaymentsWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listPaymentsSchema.optional()
  })
)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetPaymentInput = z.infer<typeof getPaymentSchema>
export type DeletePaymentInput = z.infer<typeof deletePaymentSchema>
export type CreatePaymentWithClinicInput = z.infer<typeof createPaymentWithClinicSchema>
export type ListPaymentsWithClinicInput = z.infer<typeof listPaymentsWithClinicSchema>

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'CASH':
      return 'Dinheiro'
    case 'PIX':
      return 'PIX'
    case 'CARD':
      return 'Cartão'
    default:
      return method
  }
}

export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  switch (method) {
    case 'CASH':
      return '💵'
    case 'PIX':
      return '📱'
    case 'CARD':
      return '💳'
    default:
      return '💰'
  }
}

// =====================================================================
// VALIDATION HELPERS
// =====================================================================

export const validateDateRange = (startDate?: string, endDate?: string): boolean => {
  if (!startDate || !endDate) return true
  return new Date(startDate) <= new Date(endDate)
}

export const formatPaymentAmount = (amount: number): string => {
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

// =====================================================================
// CONSTANTS
// =====================================================================

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Dinheiro', icon: '💵' },
  { value: 'PIX', label: 'PIX', icon: '📱' },
  { value: 'CARD', label: 'Cartão', icon: '💳' }
] as const

export const MAX_PAYMENT_AMOUNT = 999999.99
export const MAX_DESCRIPTION_LENGTH = 500