import { appointmentRepository } from '../infra/appointment.repository'
import { dentistRepository } from '@/modules/dentists/infra/dentist.repository'
import { procedureRepository } from '@/modules/procedures/infra/procedure.repository'
import { prisma } from '@/lib/database'
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
 * 
 * P0.1 - Validação de procedureId adicionada
 * P0.2 - Bloqueio de procedimento inativo
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

    // Regra de negócio: Verificar se dentista existe e está ativo
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
        error: 'Não é possível criar agendamento para dentista inativo'
      }
    }

    // P0.1 - CRÍTICO: Verificar se paciente existe e está ativo
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
        error: 'Não é possível criar agendamento para paciente inativo'
      }
    }

    // P0.1 & P0.2 - CRÍTICO: Validar procedureId se fornecido
    let procedureSnapshot = null
    if (validatedData.procedureId) {
      const procedure = await procedureRepository.findById(validatedData.procedureId, clinicId)

      if (!procedure) {
        return {
          success: false,
          error: 'Procedimento não encontrado ou não pertence a esta clínica'
        }
      }

      // P0.2 - Bloquear procedimento inativo
      if (!procedure.isActive) {
        return {
          success: false,
          error: 'Não é possível agendar com procedimento inativo'
        }
      }

      // Criar snapshot do procedimento
      procedureSnapshot = {
        name: procedure.name,
        baseValue: procedure.baseValue,
        commissionPercentage: procedure.commissionPercentage
      }
    }

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

    // Criar agendamento com procedureSnapshot
    const appointmentData = {
      ...validatedData,
      procedureSnapshot
    }

    const newAppointment = await appointmentRepository.create(clinicId, appointmentData as any)

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
