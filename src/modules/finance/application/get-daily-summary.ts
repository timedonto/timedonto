import { paymentRepository, DailySummary } from '../infra/payment.repository'

export interface GetDailySummaryParams {
  clinicId: string
  date?: Date
}

export interface GetDailySummaryResult {
  success: boolean
  data?: DailySummary
  error?: string
}

/**
 * Obtém resumo diário de pagamentos agrupado por método
 */
export async function getDailySummary(params: GetDailySummaryParams): Promise<GetDailySummaryResult> {
  const { clinicId, date } = params

  try {
    // Usar data atual se não fornecida
    const targetDate = date || new Date()

    console.log('getDailySummary targetDate:', targetDate.toISOString(), { clinicId })

    // Buscar resumo diário
    const dailySummary = await paymentRepository.getDailySummary(clinicId, targetDate)

    return {
      success: true,
      data: dailySummary
    }

  } catch (error) {
    console.error('Erro ao obter resumo diário:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}