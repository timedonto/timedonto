import { paymentRepository } from '../infra/payment.repository'
import { patientRepository } from '../../patients/infra/patient.repository'
import { treatmentPlanRepository } from '../../treatment-plans/infra/treatment-plan.repository'
import { 
  createPaymentSchema, 
  CreatePaymentInput, 
  PaymentOutput 
} from '../domain/payment.schema'

export interface CreatePaymentParams {
  clinicId: string
  data: CreatePaymentInput
}

export interface CreatePaymentResult {
  success: boolean
  data?: PaymentOutput
  error?: string
}

/**
 * Cria um novo pagamento com validações de regras de negócio
 */
export async function createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  const { clinicId, data } = params

  try {
    // Validar dados de entrada
    const validation = createPaymentSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Se patientId informado, paciente deve existir e pertencer à clínica
    if (validatedData.patientId) {
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
    }

    // Regra de negócio: Se treatmentPlanIds informados, validar orçamentos
    if (validatedData.treatmentPlanIds && validatedData.treatmentPlanIds.length > 0) {
      for (const treatmentPlanId of validatedData.treatmentPlanIds) {
        const treatmentPlan = await treatmentPlanRepository.findById(treatmentPlanId, clinicId)
        
        if (!treatmentPlan) {
          return {
            success: false,
            error: `Orçamento ${treatmentPlanId} não encontrado na clínica`
          }
        }

        // Só permitir orçamentos OPEN ou APPROVED
        if (!['OPEN', 'APPROVED'].includes(treatmentPlan.status)) {
          return {
            success: false,
            error: `Orçamento ${treatmentPlanId} está rejeitado e não pode ser associado ao pagamento`
          }
        }

        // Se há patientId, verificar se o orçamento pertence ao mesmo paciente
        if (validatedData.patientId && treatmentPlan.patientId !== validatedData.patientId) {
          return {
            success: false,
            error: `Orçamento ${treatmentPlanId} não pertence ao paciente selecionado`
          }
        }
      }
    }

    // Criar pagamento
    const newPayment = await paymentRepository.create(clinicId, validatedData)

    return {
      success: true,
      data: newPayment
    }

  } catch (error) {
    console.error('Erro ao criar pagamento:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}