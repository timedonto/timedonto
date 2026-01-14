import { paymentRepository } from '../infra/payment.repository'
import { patientRepository } from '../../patients/infra/patient.repository'
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