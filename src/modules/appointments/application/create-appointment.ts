import { appointmentRepository } from '../infra/appointment.repository'
import { 
  createAppointmentSchema, 
  CreateAppointmentInput, 
  AppointmentOutput 
} from '../domain/appointment.schema'

export interface CreateAppointmentParams {
  clinicId: string
  data: CreateAppointmentInput
}

export interface CreateAppointmentResult {
  success: boolean
  data?: AppointmentOutput
  error?: string
}

/**
 * Cria um novo agendamento com validações de regras de negócio
 */
export async function createAppointment(params: CreateAppointmentParams): Promise<CreateAppointmentResult> {
  const { clinicId, data } = params

  try {
    // Validar dados de entrada
    const validation = createAppointmentSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Verificar conflito de horário
    const hasConflict = await appointmentRepository.checkConflict(
      clinicId,
      validatedData.dentistId,
      validatedData.date,
      validatedData.durationMinutes
    )

    if (hasConflict) {
      return {
        success: false,
        error: 'Já existe um agendamento neste horário para este dentista'
      }
    }

    // Criar agendamento
    const newAppointment = await appointmentRepository.create(clinicId, validatedData)

    return {
      success: true,
      data: newAppointment
    }

  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}