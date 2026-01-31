import { AppointmentStatus } from '@/generated/client'
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

    // P0.2 - CRÍTICO: Buscar agendamento atual para comparar mudanças
    const currentAppointment = await appointmentRepository.findById(id, clinicId)
    if (!currentAppointment) {
      return {
        success: false,
        error: 'Agendamento não encontrado'
      }
    }

    // P0.2 - Validar dentista se mudou
    if (validatedData.dentistId && validatedData.dentistId !== currentAppointment.dentistId) {
      const { dentistRepository } = await import('@/modules/dentists/infra/dentist.repository')
      const dentist = await dentistRepository.findById(validatedData.dentistId, clinicId)

      if (!dentist) {
        return {
          success: false,
          error: 'Dentista não encontrado'
        }
      }

      if (!dentist.user.isActive) {
        return {
          success: false,
          error: 'Não é possível alterar para dentista inativo'
        }
      }

      // Verificar conflito com novo dentista
      const hasConflict = await appointmentRepository.checkConflict(
        clinicId,
        validatedData.dentistId,
        validatedData.date || currentAppointment.date.toISOString(),
        validatedData.durationMinutes || currentAppointment.durationMinutes,
        id // Excluir o próprio agendamento
      )

      if (hasConflict) {
        return {
          success: false,
          error: 'Já existe um agendamento neste horário para este dentista'
        }
      }
    }

    // P0.2 - Validar paciente se mudou
    if (validatedData.patientId && validatedData.patientId !== currentAppointment.patientId) {
      const { prisma } = await import('@/lib/database')
      const patient = await prisma.patient.findFirst({
        where: {
          id: validatedData.patientId,
          clinicId
        }
      })

      if (!patient) {
        return {
          success: false,
          error: 'Paciente não encontrado'
        }
      }

      if (!patient.isActive) {
        return {
          success: false,
          error: 'Não é possível alterar para paciente inativo'
        }
      }
    }

    // P0.2 - Validar conflito se data ou duração mudou
    const dateChanged = validatedData.date && validatedData.date !== currentAppointment.date.toISOString()
    const durationChanged = validatedData.durationMinutes && validatedData.durationMinutes !== currentAppointment.durationMinutes

    if (dateChanged || durationChanged) {
      const hasConflict = await appointmentRepository.checkConflict(
        clinicId,
        validatedData.dentistId || currentAppointment.dentistId,
        validatedData.date || currentAppointment.date.toISOString(),
        validatedData.durationMinutes || currentAppointment.durationMinutes,
        id // Excluir o próprio agendamento
      )

      if (hasConflict) {
        return {
          success: false,
          error: 'Já existe um agendamento neste horário para este dentista'
        }
      }
    }

    // P0.2 - Validar procedimento se mudou e criar novo snapshot
    let updateData: any = { ...validatedData }

    if (validatedData.procedureId) {
      const { procedureRepository } = await import('@/modules/procedures/infra/procedure.repository')
      const procedure = await procedureRepository.findById(validatedData.procedureId, clinicId)

      if (!procedure) {
        return {
          success: false,
          error: 'Procedimento não encontrado ou não pertence a esta clínica'
        }
      }

      if (!procedure.isActive) {
        return {
          success: false,
          error: 'Não é possível alterar para procedimento inativo'
        }
      }

      // Criar novo snapshot
      updateData.procedureSnapshot = {
        name: procedure.name,
        baseValue: procedure.baseValue,
        commissionPercentage: procedure.commissionPercentage
      }
    }

    // Atualizar agendamento
    const updatedAppointment = await appointmentRepository.update(id, clinicId, updateData)

    if (!updatedAppointment) {
      return {
        success: false,
        error: 'Erro ao atualizar agendamento'
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