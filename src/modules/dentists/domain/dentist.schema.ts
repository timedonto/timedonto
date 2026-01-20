import { z } from 'zod'
import { ProcedureOutput } from '../../procedures/domain/procedure.schema'

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

// Schema para horários de trabalho (JSON flexível)
const workingHoursSchema = z.record(z.string(), z.any()).optional().nullable()

// Schema para dados bancários (JSON flexível)
const bankInfoSchema = z.record(z.string(), z.any()).optional().nullable()

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createDentistSchema = z.object({
  userId: z
    .string()
    .cuid('ID do usuário deve ser um CUID válido'),
  cro: z
    .string()
    .min(1, 'CRO é obrigatório')
    .max(50, 'CRO deve ter no máximo 50 caracteres')
    .trim()
    .regex(/^CRO-[A-Z]{2}\s+\d+$/, 'CRO deve seguir o formato: CRO-SP 12345'),
  specialty: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      if (!val) return null
      if (Array.isArray(val)) return val.filter(s => s !== 'none').join(', ')
      return val === 'none' ? null : val
    })
    .optional()
    .nullable(),
  workingHours: workingHoursSchema,
  bankInfo: bankInfoSchema,
  commission: z
    .number()
    .min(0, 'Comissão deve ser no mínimo 0%')
    .max(100, 'Comissão deve ser no máximo 100%')
    .optional()
})

export const updateDentistSchema = z.object({
  cro: z
    .string()
    .min(1, 'CRO é obrigatório')
    .max(50, 'CRO deve ter no máximo 50 caracteres')
    .trim()
    .regex(/^CRO-[A-Z]{2}\s+\d+$/, 'CRO deve seguir o formato: CRO-SP 12345')
    .optional(),
  specialty: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      if (!val) return null
      if (Array.isArray(val)) return val.filter(s => s !== 'none').join(', ')
      return val === 'none' ? null : val
    })
    .optional()
    .nullable(),
  workingHours: workingHoursSchema,
  bankInfo: bankInfoSchema,
  commission: z
    .number()
    .min(0, 'Comissão deve ser no mínimo 0%')
    .max(100, 'Comissão deve ser no máximo 100%')
    .optional()
})

export const updateDentistProfileSchema = z.object({
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
    .optional(),
  cro: z
    .string()
    .min(1, 'CRO é obrigatório')
    .max(50, 'CRO deve ter no máximo 50 caracteres')
    .trim()
    .regex(/^CRO-[A-Z]{2}\s+\d+$/, 'CRO deve seguir o formato: CRO-SP 12345')
    .optional(),
  specialty: z.string().optional().nullable(),
  workingHours: workingHoursSchema,
  bankInfo: bankInfoSchema,
  commission: z
    .number()
    .min(0, 'Comissão deve ser no mínimo 0%')
    .max(100, 'Comissão deve ser no máximo 100%')
    .optional()
})

export const listDentistsSchema = z.object({
  specialty: z
    .string()
    .min(1, 'Especialidade deve ter pelo menos 1 caractere')
    .max(100, 'Especialidade deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
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

export type CreateDentistInput = z.infer<typeof createDentistSchema>
export type UpdateDentistInput = z.infer<typeof updateDentistSchema>
export type UpdateDentistProfileInput = z.infer<typeof updateDentistProfileSchema>
export type ListDentistsInput = z.infer<typeof listDentistsSchema>

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface DentistOutput {
  id: string
  clinicId: string
  userId: string
  cro: string
  specialty: string | null
  workingHours: Record<string, any> | null
  bankInfo: Record<string, any> | null
  commission: number | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
    isActive: boolean
  }
  procedures: ProcedureOutput[]
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const dentistIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

export const userIdSchema = z.object({
  userId: z.string().cuid('ID do usuário deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getDentistSchema = dentistIdSchema

export const deleteDentistSchema = dentistIdSchema

export const updateDentistWithIdSchema = dentistIdSchema.merge(
  z.object({
    data: updateDentistSchema
  })
)

export const createDentistWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createDentistSchema
  })
)

export const listDentistsWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listDentistsSchema.optional()
  })
)

export const getDentistByUserSchema = clinicIdSchema.merge(userIdSchema)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetDentistInput = z.infer<typeof getDentistSchema>
export type DeleteDentistInput = z.infer<typeof deleteDentistSchema>
export type UpdateDentistWithIdInput = z.infer<typeof updateDentistWithIdSchema>
export type CreateDentistWithClinicInput = z.infer<typeof createDentistWithClinicSchema>
export type ListDentistsWithClinicInput = z.infer<typeof listDentistsWithClinicSchema>
export type GetDentistByUserInput = z.infer<typeof getDentistByUserSchema>

// =====================================================================
// WORKING HOURS SCHEMAS (ESTRUTURADOS)
// =====================================================================

// Schema mais estruturado para horários de trabalho (opcional)
export const structuredWorkingHoursSchema = z.object({
  monday: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
  }).optional(),
  tuesday: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
  }).optional(),
  wednesday: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
  }).optional(),
  thursday: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
  }).optional(),
  friday: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
  }).optional(),
  saturday: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
  }).optional(),
  sunday: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM').optional(),
  }).optional(),
}).optional()

// =====================================================================
// BANK INFO SCHEMAS (ESTRUTURADOS)
// =====================================================================

// Schema mais estruturado para dados bancários (opcional)
export const structuredBankInfoSchema = z.object({
  bankCode: z.string().min(3, 'Código do banco deve ter pelo menos 3 dígitos').optional(),
  bankName: z.string().min(1, 'Nome do banco é obrigatório').optional(),
  agency: z.string().min(1, 'Agência é obrigatória').optional(),
  account: z.string().min(1, 'Conta é obrigatória').optional(),
  accountType: z.enum(['checking', 'savings'], {
    message: 'Tipo de conta deve ser corrente ou poupança'
  }).optional(),
  pixKey: z.string().optional(),
  pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random'], {
    message: 'Tipo de chave PIX inválido'
  }).optional(),
}).optional()

export type StructuredWorkingHours = z.infer<typeof structuredWorkingHoursSchema>
export type StructuredBankInfo = z.infer<typeof structuredBankInfoSchema>

// =====================================================================
// SPECIALTY CONSTANTS
// =====================================================================

export const COMMON_SPECIALTIES = [
  'Acupuntura',
  'Cirurgia e Traumatologia Bucomaxilofacial',
  'Dentística',
  'Disfunção Temporomandibular e Dor Orofacial',
  'Endodontia',
  'Estomatologia',
  'Harmonização Orofacial',
  'Homeopatia',
  'Implantodontia',
  'Odontogeriatria',
  'Odontologia do Esporte',
  'Odontologia do Trabalho',
  'Odontologia Legal',
  'Odontologia para Pacientes com Necessidades Especiais',
  'Odontopediatria',
  'Ortodontia',
  'Ortopedia Funcional dos Maxilares',
  'Patologia Oral',
  'Periodontia',
  'Prótese Bucomaxilofacial',
  'Prótese Dentária',
  'Radiologia Odontológica e Imaginologia',
  'Saúde Coletiva'
] as const

export type CommonSpecialty = typeof COMMON_SPECIALTIES[number]