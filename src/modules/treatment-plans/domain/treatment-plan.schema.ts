import { z } from 'zod'

// =====================================================================
// ENUMS
// =====================================================================

export const TreatmentPlanStatusEnum = z.enum(['OPEN', 'APPROVED', 'REJECTED'])

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const treatmentItemSchema = z.object({
  description: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .trim(),
  tooth: z
    .string()
    .max(10, 'Dente deve ter no máximo 10 caracteres')
    .trim()
    .nullable()
    .optional(),
  value: z
    .number()
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor deve ser no máximo R$ 999.999,99'),
  quantity: z
    .number()
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser positiva')
    .max(999, 'Quantidade deve ser no máximo 999')
    .default(1)
})

export const createTreatmentPlanSchema = z.object({
  patientId: z.string().cuid('ID do paciente deve ser um CUID válido'),
  dentistId: z.string().cuid('ID do dentista deve ser um CUID válido'),
  notes: z
    .string()
    .max(2000, 'Observações devem ter no máximo 2000 caracteres')
    .trim()
    .nullable()
    .optional(),
  items: z
    .array(treatmentItemSchema)
    .min(1, 'Deve haver pelo menos um item no orçamento')
    .max(50, 'Máximo de 50 itens por orçamento')
})

export const updateTreatmentPlanSchema = z.object({
  status: TreatmentPlanStatusEnum.optional(),
  notes: z
    .string()
    .max(2000, 'Observações devem ter no máximo 2000 caracteres')
    .trim()
    .nullable()
    .optional(),
  items: z
    .array(treatmentItemSchema)
    .min(1, 'Deve haver pelo menos um item no orçamento')
    .max(50, 'Máximo de 50 itens por orçamento')
    .optional()
})

export const listTreatmentPlansSchema = z.object({
  patientId: z
    .string()
    .cuid('ID do paciente deve ser um CUID válido')
    .optional(),
  dentistId: z
    .string()
    .cuid('ID do dentista deve ser um CUID válido')
    .optional(),
  status: TreatmentPlanStatusEnum.optional()
})

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type TreatmentItemInput = z.infer<typeof treatmentItemSchema>
export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>
export type UpdateTreatmentPlanInput = z.infer<typeof updateTreatmentPlanSchema>
export type ListTreatmentPlansInput = z.infer<typeof listTreatmentPlansSchema>
export type TreatmentPlanStatus = z.infer<typeof TreatmentPlanStatusEnum>

// Export aliases as requested
export type CreateTreatmentPlanData = CreateTreatmentPlanInput
export type UpdateTreatmentPlanData = UpdateTreatmentPlanInput
export type ListTreatmentPlansFilters = ListTreatmentPlansInput
export type TreatmentItemData = TreatmentItemInput

// =====================================================================
// OUTPUT INTERFACES
// =====================================================================

export interface TreatmentItemOutput {
  id: string
  planId: string
  description: string
  tooth: string | null
  value: number
  quantity: number
}

export interface TreatmentPlanPatientOutput {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export interface TreatmentPlanDentistUserOutput {
  id: string
  name: string
  email: string
}

export interface TreatmentPlanDentistOutput {
  id: string
  cro: string
  specialty: string | null
  user: TreatmentPlanDentistUserOutput
}

export interface TreatmentPlanOutput {
  id: string
  clinicId: string
  patientId: string
  dentistId: string
  status: TreatmentPlanStatus
  totalAmount: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
  items: TreatmentItemOutput[]
  patient?: TreatmentPlanPatientOutput | null
  dentist?: TreatmentPlanDentistOutput | null
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const treatmentPlanIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getTreatmentPlanSchema = treatmentPlanIdSchema

export const deleteTreatmentPlanSchema = treatmentPlanIdSchema

export const updateTreatmentPlanWithIdSchema = treatmentPlanIdSchema.merge(
  z.object({
    data: updateTreatmentPlanSchema
  })
)

export const createTreatmentPlanWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createTreatmentPlanSchema
  })
)

export const listTreatmentPlansWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listTreatmentPlansSchema.optional()
  })
)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetTreatmentPlanInput = z.infer<typeof getTreatmentPlanSchema>
export type DeleteTreatmentPlanInput = z.infer<typeof deleteTreatmentPlanSchema>
export type UpdateTreatmentPlanWithIdInput = z.infer<typeof updateTreatmentPlanWithIdSchema>
export type CreateTreatmentPlanWithClinicInput = z.infer<typeof createTreatmentPlanWithClinicSchema>
export type ListTreatmentPlansWithClinicInput = z.infer<typeof listTreatmentPlansWithClinicSchema>

// =====================================================================
// CALCULATION HELPERS
// =====================================================================

export const calculateTotalAmount = (items: TreatmentItemInput[]): number => {
  return items.reduce((total, item) => {
    return total + (item.value * item.quantity)
  }, 0)
}

// Schema para validar o cálculo do total
export const treatmentPlanWithCalculatedTotalSchema = createTreatmentPlanSchema.transform((data) => ({
  ...data,
  totalAmount: calculateTotalAmount(data.items)
}))

export type TreatmentPlanWithCalculatedTotal = z.infer<typeof treatmentPlanWithCalculatedTotalSchema>