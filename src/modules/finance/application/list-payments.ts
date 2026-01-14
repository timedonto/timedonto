import { paymentRepository } from '../infra/payment.repository'
import { 
  listPaymentsSchema, 
  ListPaymentsInput, 
  PaymentOutput 
} from '../domain/payment.schema'

export interface ListPaymentsParams {
  clinicId: string
  filters?: ListPaymentsInput
}

export interface ListPaymentsResult {
  success: true
  data: PaymentOutput[]
}

/**
 * Lista pagamentos de uma clínica com filtros opcionais
 */
export async function listPayments(params: ListPaymentsParams): Promise<ListPaymentsResult> {
  const { clinicId, filters } = params

  // Validar filtros se fornecidos
  if (filters) {
    const validation = listPaymentsSchema.safeParse(filters)
    if (!validation.success) {
      throw new Error(`Filtros inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
    }
  }

  // Buscar pagamentos
  const payments = await paymentRepository.findMany(clinicId, filters)

  return {
    success: true,
    data: payments
  }
}