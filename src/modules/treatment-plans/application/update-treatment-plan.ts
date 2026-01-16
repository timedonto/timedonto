import { treatmentPlanRepository } from '../infra/treatment-plan.repository'
import { 
  updateTreatmentPlanSchema, 
  UpdateTreatmentPlanInput, 
  TreatmentPlanOutput,
  TreatmentPlanStatus 
} from '../domain/treatment-plan.schema'

export interface UpdateTreatmentPlanParams {
  id: string
  clinicId: string
  data: UpdateTreatmentPlanInput
  userRole?: 'OWNER' | 'ADMIN' | 'DENTIST' | 'RECEPTIONIST'
}

export interface UpdateTreatmentPlanResult {
  success: boolean
  data?: TreatmentPlanOutput
  error?: string
}

/**
 * Atualiza um orçamento com validações de regras de negócio e permissões
 */
export async function updateTreatmentPlan(params: UpdateTreatmentPlanParams): Promise<UpdateTreatmentPlanResult> {
  const { id, clinicId, data, userRole } = params

  try {
    // Validar dados de entrada
    const validation = updateTreatmentPlanSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Verificar se orçamento existe e pertence à clínica
    const existingTreatmentPlan = await treatmentPlanRepository.findById(id, clinicId)
    if (!existingTreatmentPlan) {
      return {
        success: false,
        error: 'Orçamento não encontrado'
      }
    }

    // Regra de negócio: Apenas OWNER, ADMIN e DENTIST podem aprovar/rejeitar orçamentos
    if (validatedData.status && validatedData.status !== 'OPEN') {
      const allowedRoles = ['OWNER', 'ADMIN', 'DENTIST']
      if (!userRole || !allowedRoles.includes(userRole)) {
        return {
          success: false,
          error: 'Você não tem permissão para aprovar ou rejeitar orçamentos'
        }
      }
    }

    // Regra de negócio: Não é possível alterar orçamentos já aprovados ou rejeitados
    if (existingTreatmentPlan.status !== 'OPEN' && validatedData.status) {
      return {
        success: false,
        error: `Não é possível alterar o status de um orçamento ${existingTreatmentPlan.status === 'APPROVED' ? 'aprovado' : 'rejeitado'}`
      }
    }

    // Regra de negócio: Não é possível editar itens de orçamentos já aprovados ou rejeitados
    if (validatedData.items !== undefined && existingTreatmentPlan.status !== 'OPEN') {
      return {
        success: false,
        error: `Não é possível editar os itens de um orçamento ${existingTreatmentPlan.status === 'APPROVED' ? 'aprovado' : 'rejeitado'}. Apenas orçamentos em aberto podem ser editados.`
      }
    }

    // Atualizar orçamento
    const updatedTreatmentPlan = await treatmentPlanRepository.update(id, clinicId, validatedData)

    if (!updatedTreatmentPlan) {
      return {
        success: false,
        error: 'Erro ao atualizar orçamento'
      }
    }

    return {
      success: true,
      data: updatedTreatmentPlan
    }

  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}