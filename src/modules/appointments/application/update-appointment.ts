import { appointmentRepository } from '../infra/appointment.repository'
import { 
  updateAppointmentSchema, 
  UpdateAppointmentInput, 
  AppointmentOutput 
} from '../domain/appointment.schema'

export interface UpdateAppointmentParams {
  id: string
  clinicId: string
  data: UpdateAppointmentInput
}

export interface UpdateAppointmentResult {
  success: boolean
  data?: AppointmentOutput
  error?: string
}

/**
 * Atualiza um agendamento existente com validações de regras de negócio
 */
export async function updateAppointment(params: UpdateAppointmentParams): Promise<UpdateAppointmentResult> {
  const { id, clinicId, data } = params

  try {
    // Validar dados de entrada
    const validation = updateAppointmentSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Se está alterando data/hora ou dentista, verificar conflito
    if (validatedData.date || validatedData.durationMinutes || validatedData.dentistId) {
      // Buscar agendamento atual para obter dados necessários para verificação
      const currentAppointment = await appointmentRepository.findById(id, clinicId)
      
      if (!currentAppointment) {
        return {
          success: false,
          error: 'Agendamento não encontrado'
        }
      }

      // Usar dados atuais como fallback se não foram fornecidos na atualização
      const dentistId = validatedData.dentistId || currentAppointment.dentistId
      const date = validatedData.date || currentAppointment.date.toISOString()
      const durationMinutes = validatedData.durationMinutes || currentAppointment.durationMinutes

      // Verificar conflito excluindo o próprio agendamento
      const hasConflict = await appointmentRepository.checkConflict(
        clinicId,
        dentistId,
        date,
        durationMinutes,
        id // Excluir o próprio ID da verificação
      )

      if (hasConflict) {
        return {
          success: false,
          error: 'Já existe um agendamento neste horário para este dentista'
        }
      }
    }

    // Atualizar agendamento
    const updatedAppointment = await appointmentRepository.update(id, clinicId, validatedData)

    if (!updatedAppointment) {
      return {
        success: false,
        error: 'Agendamento não encontrado'
      }
    }

    return {
      success: true,
      data: updatedAppointment
    }

  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}