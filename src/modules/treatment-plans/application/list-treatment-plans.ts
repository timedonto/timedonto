import { treatmentPlanRepository } from '../infra/treatment-plan.repository'
import { 
  listTreatmentPlansSchema, 
  ListTreatmentPlansInput, 
  TreatmentPlanOutput 
} from '../domain/treatment-plan.schema'

export interface ListTreatmentPlansParams {
  clinicId: string
  filters?: ListTreatmentPlansInput
}

export interface ListTreatmentPlansResult {
  success: true
  data: TreatmentPlanOutput[]
}

/**
 * Lista orçamentos de uma clínica com filtros opcionais
 */
export async function listTreatmentPlans(params: ListTreatmentPlansParams): Promise<ListTreatmentPlansResult> {
  const { clinicId, filters } = params

  // Validar filtros se fornecidos
  if (filters) {
    const validation = listTreatmentPlansSchema.safeParse(filters)
    if (!validation.success) {
      throw new Error(`Filtros inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
    }
  }

  // Buscar orçamentos
  const treatmentPlans = await treatmentPlanRepository.findMany(clinicId, filters)

  return {
    success: true,
    data: treatmentPlans
  }
}