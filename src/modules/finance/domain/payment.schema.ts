import { z } from 'zod'

// =====================================================================
// ENUMS
// =====================================================================

export const PaymentMethodEnum = z.enum(['CASH', 'PIX', 'CARD'])
export const DiscountTypeEnum = z.enum(['PERCENTAGE', 'FIXED'])

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createPaymentSchema = z.object({
  amount: z
    .number()
    .nonnegative('Valor não pode ser negativo')
    .max(999999.99, 'Valor deve ser no máximo R$ 999.999,99')
    .optional(), // Opcional quando treatmentPlanIds for fornecido
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
    .optional(),
  treatmentPlanIds: z
    .array(z.string().cuid('ID do orçamento deve ser um CUID válido'))
    .optional(),
  discountType: DiscountTypeEnum.nullable().optional(),
  discountValue: z
    .number()
    .nonnegative('Valor do desconto não pode ser negativo')
    .max(999999.99, 'Valor do desconto deve ser no máximo R$ 999.999,99')
    .nullable()
    .optional()
}).refine(
  (data) => {
    // Se discountType está definido, discountValue deve estar definido
    if (data.discountType && (data.discountValue === undefined || data.discountValue === null)) {
      return false
    }
    // Se discountValue está definido, discountType deve estar definido
    if (data.discountValue !== undefined && data.discountValue !== null && !data.discountType) {
      return false
    }
    return true
  },
  {
    message: 'Tipo e valor de desconto devem ser informados juntos',
    path: ['discountType']
  }
).refine(
  (data) => {
    if (!data.discountType || data.discountValue === undefined || data.discountValue === null) {
      return true
    }
    // Se for percentual, valor deve estar entre 0 e 100
    if (data.discountType === 'PERCENTAGE' && (data.discountValue < 0 || data.discountValue > 100)) {
      return false
    }
    return true
  },
  {
    message: 'Desconto percentual deve estar entre 0% e 100%',
    path: ['discountValue']
  }
).refine(
  (data) => {
    // Se não há treatmentPlanIds, amount é obrigatório
    if (!data.treatmentPlanIds || data.treatmentPlanIds.length === 0) {
      return data.amount !== undefined && data.amount !== null
    }
    return true
  },
  {
    message: 'Valor é obrigatório quando não há orçamentos associados',
    path: ['amount']
  }
)

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
  originalAmount: number
  discountType: 'PERCENTAGE' | 'FIXED' | null
  discountValue: number | null
  amount: number // finalAmount - mantido como 'amount' para compatibilidade
  method: PaymentMethod
  description: string | null
  createdAt: Date
  patient?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
  treatmentPlans?: {
    id: string
    status: string
    totalAmount: number
    notes: string | null
  }[]
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

export const calculateFinalAmount = (
  originalAmount: number,
  discountType: 'PERCENTAGE' | 'FIXED' | null,
  discountValue: number | null
): number => {
  if (!discountType || discountValue === null || discountValue === undefined) {
    return originalAmount
  }

  if (discountType === 'PERCENTAGE') {
    const discount = (originalAmount * discountValue) / 100
    return Math.max(0, originalAmount - discount)
  } else {
    // FIXED
    return Math.max(0, originalAmount - discountValue)
  }
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