import { appointmentRepository } from '../infra/appointment.repository'
import { AppointmentOutput } from '../domain/appointment.schema'

export interface GetAppointmentParams {
  id: string
  clinicId: string
}

export interface GetAppointmentResult {
  success: boolean
  data?: AppointmentOutput | null
  error?: string
}

/**
 * Busca um agendamento por ID com todas as relações
 */
export async function getAppointment(params: GetAppointmentParams): Promise<GetAppointmentResult> {
  const { id, clinicId } = params

  try {
    // Validar se ID foi fornecido
    if (!id) {
      return {
        success: false,
        error: 'ID do agendamento é obrigatório'
      }
    }

    if (!clinicId) {
      return {
        success: false,
        error: 'ID da clínica é obrigatório'
      }
    }

    // Buscar agendamento
    const appointment = await appointmentRepository.findById(id, clinicId)

    return {
      success: true,
      data: appointment
    }

  } catch (error) {
    console.error('Erro ao buscar agendamento:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}