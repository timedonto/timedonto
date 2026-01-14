import { treatmentPlanRepository } from '../infra/treatment-plan.repository'
import { TreatmentPlanOutput } from '../domain/treatment-plan.schema'

export interface GetTreatmentPlanParams {
  id: string
  clinicId: string
}

export interface GetTreatmentPlanResult {
  success: boolean
  data?: TreatmentPlanOutput | null
  error?: string
}

/**
 * Busca um orçamento por ID validando que pertence à clínica
 */
export async function getTreatmentPlan(params: GetTreatmentPlanParams): Promise<GetTreatmentPlanResult> {
  const { id, clinicId } = params

  try {
    // Buscar orçamento
    const treatmentPlan = await treatmentPlanRepository.findById(id, clinicId)

    return {
      success: true,
      data: treatmentPlan
    }

  } catch (error) {
    console.error('Erro ao buscar orçamento:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}