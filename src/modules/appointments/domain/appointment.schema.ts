import { z } from 'zod'
import { AppointmentStatus } from '@prisma/client'

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createAppointmentSchema = z.object({
  dentistId: z
    .string()
    .cuid('ID do dentista deve ser um CUID válido'),
  patientId: z
    .string()
    .cuid('ID do paciente deve ser um CUID válido'),
  date: z
    .string()
    .datetime('Data deve ser uma data ISO válida'),
  durationMinutes: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração deve ser no mínimo 15 minutos')
    .max(480, 'Duração deve ser no máximo 8 horas (480 minutos)')
    .default(30),
  status: z.nativeEnum(AppointmentStatus, {
    errorMap: () => ({ message: 'Status deve ser SCHEDULED, CONFIRMED, CANCELED, RESCHEDULED, NO_SHOW ou DONE' })
  }).default(AppointmentStatus.SCHEDULED),
  procedureId: z
    .string()
    .cuid('ID do procedimento deve ser um CUID válido')
    .optional(),
  procedure: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null
      const trimmed = val.trim()
      if (trimmed === '') return null
      if (trimmed.length > 200) throw new Error('Procedimento deve ter no máximo 200 caracteres')
      return trimmed
    }),
  notes: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null
      const trimmed = val.trim()
      if (trimmed === '') return null
      if (trimmed.length > 1000) throw new Error('Observações devem ter no máximo 1000 caracteres')
      return trimmed
    })
})

export const updateAppointmentSchema = z.object({
  dentistId: z
    .string()
    .cuid('ID do dentista deve ser um CUID válido')
    .optional(),
  patientId: z
    .string()
    .cuid('ID do paciente deve ser um CUID válido')
    .optional(),
  date: z
    .string()
    .datetime('Data deve ser uma data ISO válida')
    .optional(),
  durationMinutes: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração deve ser no mínimo 15 minutos')
    .max(480, 'Duração deve ser no máximo 8 horas (480 minutos)')
    .optional(),
  status: z.nativeEnum(AppointmentStatus, {
    errorMap: () => ({ message: 'Status deve ser SCHEDULED, CONFIRMED, CANCELED, RESCHEDULED, NO_SHOW ou DONE' })
  }).optional(),
  procedureId: z
    .string()
    .cuid('ID do procedimento deve ser um CUID válido')
    .optional(),
  procedure: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null
      const trimmed = val.trim()
      if (trimmed === '') return null
      if (trimmed.length > 200) throw new Error('Procedimento deve ter no máximo 200 caracteres')
      return trimmed
    }),
  notes: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null
      const trimmed = val.trim()
      if (trimmed === '') return null
      if (trimmed.length > 1000) throw new Error('Observações devem ter no máximo 1000 caracteres')
      return trimmed
    })
})

export const listAppointmentsSchema = z.object({
  dentistId: z
    .string()
    .cuid('ID do dentista deve ser um CUID válido')
    .optional(),
  patientId: z
    .string()
    .cuid('ID do paciente deve ser um CUID válido')
    .optional(),
  date: z
    .string()
    .datetime('Data deve ser uma data ISO válida')
    .optional(),
  dateFrom: z
    .string()
    .datetime('Data inicial deve ser uma data ISO válida')
    .optional(),
  dateTo: z
    .string()
    .datetime('Data final deve ser uma data ISO válida')
    .optional(),
  status: z.nativeEnum(AppointmentStatus, {
    errorMap: () => ({ message: 'Status deve ser SCHEDULED, CONFIRMED, CANCELED, RESCHEDULED, NO_SHOW ou DONE' })
  }).optional()
})

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>

// Export aliases as requested
export type CreateAppointmentData = CreateAppointmentInput
export type UpdateAppointmentData = UpdateAppointmentInput
export type ListAppointmentsFilters = ListAppointmentsInput

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface AppointmentOutput {
  id: string
  clinicId: string
  dentistId: string
  patientId: string
  date: Date
  durationMinutes: number
  status: AppointmentStatus
  procedure: string | null
  procedureId?: string | null
  procedureSnapshot?: {
    name: string
    baseValue: number
    commissionPercentage: number
  } | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  dentist: {
    id: string
    cro: string
    specialty: string | null
    user: {
      id: string
      name: string
      email: string
    }
  }
  patient: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const appointmentIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

export const dentistIdSchema = z.object({
  dentistId: z.string().cuid('ID do dentista deve ser um CUID válido')
})

export const patientIdSchema = z.object({
  patientId: z.string().cuid('ID do paciente deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getAppointmentSchema = appointmentIdSchema

export const deleteAppointmentSchema = appointmentIdSchema

export const updateAppointmentWithIdSchema = appointmentIdSchema.merge(
  z.object({
    data: updateAppointmentSchema
  })
)

export const createAppointmentWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createAppointmentSchema
  })
)

export const listAppointmentsWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listAppointmentsSchema.optional()
  })
)

export const listAppointmentsByDentistSchema = clinicIdSchema.merge(dentistIdSchema).merge(
  z.object({
    filters: listAppointmentsSchema.optional()
  })
)

export const listAppointmentsByPatientSchema = clinicIdSchema.merge(patientIdSchema).merge(
  z.object({
    filters: listAppointmentsSchema.optional()
  })
)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetAppointmentInput = z.infer<typeof getAppointmentSchema>
export type DeleteAppointmentInput = z.infer<typeof deleteAppointmentSchema>
export type UpdateAppointmentWithIdInput = z.infer<typeof updateAppointmentWithIdSchema>
export type CreateAppointmentWithClinicInput = z.infer<typeof createAppointmentWithClinicSchema>
export type ListAppointmentsWithClinicInput = z.infer<typeof listAppointmentsWithClinicSchema>
export type ListAppointmentsByDentistInput = z.infer<typeof listAppointmentsByDentistSchema>
export type ListAppointmentsByPatientInput = z.infer<typeof listAppointmentsByPatientSchema>

// =====================================================================
// DATE VALIDATION HELPERS
// =====================================================================

// Schema para validar conflitos de horário
export const appointmentConflictSchema = z.object({
  dentistId: z.string().cuid(),
  date: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480),
  excludeAppointmentId: z.string().cuid().optional() // Para excluir o próprio agendamento na validação de update
})

export type AppointmentConflictInput = z.infer<typeof appointmentConflictSchema>

// Schema para validar horário de trabalho do dentista
export const workingHoursValidationSchema = z.object({
  dentistId: z.string().cuid(),
  date: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480)
})

export type WorkingHoursValidationInput = z.infer<typeof workingHoursValidationSchema>

// =====================================================================
// STATUS CONSTANTS
// =====================================================================

export const APPOINTMENT_STATUS_LABELS = {
  [AppointmentStatus.SCHEDULED]: 'Agendado',
  [AppointmentStatus.CONFIRMED]: 'Confirmado',
  [AppointmentStatus.CANCELED]: 'Cancelado',
  [AppointmentStatus.RESCHEDULED]: 'Reagendado',
  [AppointmentStatus.NO_SHOW]: 'Não Compareceu',
  [AppointmentStatus.DONE]: 'Concluído'
} as const

export const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED
] as const

export const COMPLETED_APPOINTMENT_STATUSES = [
  AppointmentStatus.DONE,
  AppointmentStatus.CANCELED,
  AppointmentStatus.NO_SHOW
] as const

// =====================================================================
// COMMON PROCEDURES
// =====================================================================

export const COMMON_PROCEDURES = [
  'Consulta',
  'Limpeza',
  'Restauração',
  'Extração',
  'Canal',
  'Clareamento',
  'Prótese',
  'Implante',
  'Ortodontia',
  'Cirurgia',
  'Avaliação',
  'Retorno'
] as const

export type CommonProcedure = typeof COMMON_PROCEDURES[number]