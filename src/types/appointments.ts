// src/types/appointments.ts
// =====================================================================
// Tipos para Agendamentos - Usar no Frontend (client components)
// =====================================================================
// IMPORTANTE: Este arquivo substitui imports do @prisma/client
// em componentes com "use client"
// =====================================================================

// Enum de status de agendamento (espelha o Prisma schema)
export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CANCELED: 'CANCELED',
  RESCHEDULED: 'RESCHEDULED',
  NO_SHOW: 'NO_SHOW',
  DONE: 'DONE',
} as const

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

// Labels em português para exibição
export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
  RESCHEDULED: 'Remarcado',
  NO_SHOW: 'Falta',
  DONE: 'Atendido',
}

// Cores para os badges de status
export const AppointmentStatusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-red-100 text-red-800',
  RESCHEDULED: 'bg-yellow-100 text-yellow-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
  DONE: 'bg-emerald-100 text-emerald-800',
}

// Tipo do dentista com relações
export interface DentistInfo {
  id: string
  user: {
    name: string
  }
  specialty: string | null
}

// Tipo do paciente
export interface PatientInfo {
  id: string
  name: string
  phone: string | null
  email?: string | null
}

// Tipo do agendamento para usar no frontend
export interface AppointmentWithRelations {
  id: string
  clinicId: string
  dentistId: string
  patientId: string
  date: string | Date
  durationMinutes: number
  status: AppointmentStatus
  procedure: string | null
  notes: string | null
  createdAt: string | Date
  updatedAt: string | Date
  dentist: DentistInfo
  patient: PatientInfo
}

// Tipo para criação de agendamento
export interface CreateAppointmentData {
  dentistId: string
  patientId: string
  date: string | Date
  durationMinutes?: number
  procedure?: string
  notes?: string
}

// Tipo para atualização de agendamento
export interface UpdateAppointmentData {
  dentistId?: string
  patientId?: string
  date?: string | Date
  durationMinutes?: number
  status?: AppointmentStatus
  procedure?: string
  notes?: string
}

// Filtros para listagem
export interface AppointmentFilters {
  date?: string
  dentistId?: string
  patientId?: string
  status?: AppointmentStatus
}
