import { paymentRepository, MonthlySummary } from '../infra/payment.repository'

export interface GetMonthlySummaryParams {
  clinicId: string
  year: number
  month: number
}

export interface GetMonthlySummaryResult {
  success: boolean
  data?: MonthlySummary
  error?: string
}

/**
 * Obtém resumo mensal de pagamentos agrupado por método
 */
export async function getMonthlySummary(params: GetMonthlySummaryParams): Promise<GetMonthlySummaryResult> {
  const { clinicId, year, month } = params

  try {
    // Validar parâmetros
    if (year < 2000 || year > 3000) {
      return {
        success: false,
        error: 'Ano deve estar entre 2000 e 3000'
      }
    }

    if (month < 1 || month > 12) {
      return {
        success: false,
        error: 'Mês deve estar entre 1 e 12'
      }
    }

    // Validar que não é um mês futuro
    const today = new Date()
    const targetDate = new Date(year, month - 1, 1) // month é 0-indexed no Date
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    if (targetDate > currentMonth) {
      return {
        success: false,
        error: 'Não é possível obter resumo de meses futuros'
      }
    }

    // Buscar resumo mensal
    const monthlySummary = await paymentRepository.getMonthlySummary(clinicId, year, month)

    return {
      success: true,
      data: monthlySummary
    }

  } catch (error) {
    console.error('Erro ao obter resumo mensal:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}