import { treatmentPlanRepository } from '../infra/treatment-plan.repository'
import { patientRepository } from '../../patients/infra/patient.repository'
import { dentistRepository } from '../../dentists/infra/dentist.repository'
import { 
  createTreatmentPlanSchema, 
  CreateTreatmentPlanInput, 
  TreatmentPlanOutput 
} from '../domain/treatment-plan.schema'

export interface CreateTreatmentPlanParams {
  clinicId: string
  data: CreateTreatmentPlanInput
}

export interface CreateTreatmentPlanResult {
  success: boolean
  data?: TreatmentPlanOutput
  error?: string
}

/**
 * Cria um novo orçamento com validações de regras de negócio
 */
export async function createTreatmentPlan(params: CreateTreatmentPlanParams): Promise<CreateTreatmentPlanResult> {
  const { clinicId, data } = params

  try {
    // Validar dados de entrada
    const validation = createTreatmentPlanSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Paciente deve existir e pertencer à clínica
    const patient = await patientRepository.findById(validatedData.patientId, clinicId)
    if (!patient) {
      return {
        success: false,
        error: 'Paciente não encontrado na clínica'
      }
    }

    if (!patient.isActive) {
      return {
        success: false,
        error: 'Paciente está inativo'
      }
    }

    // Regra de negócio: Dentista deve existir e pertencer à clínica
    const dentist = await dentistRepository.findById(validatedData.dentistId, clinicId)
    if (!dentist) {
      return {
        success: false,
        error: 'Dentista não encontrado na clínica'
      }
    }

    if (!dentist.user.isActive) {
      return {
        success: false,
        error: 'Dentista está inativo'
      }
    }

    // Criar orçamento
    const newTreatmentPlan = await treatmentPlanRepository.create(clinicId, validatedData)

    return {
      success: true,
      data: newTreatmentPlan
    }

  } catch (error) {
    console.error('Erro ao criar orçamento:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}