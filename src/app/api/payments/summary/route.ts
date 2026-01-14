import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDailySummary, getMonthlySummary } from '@/modules/finance/application'

/**
 * GET /api/payments/summary
 * Obtém resumo financeiro (diário ou mensal)
 * Permissão: OWNER, ADMIN
 * 
 * Query params:
 * - type: 'daily' | 'monthly' (obrigatório)
 * - date: string (ISO date, para tipo daily, opcional - default hoje)
 * - year: number (para tipo monthly, obrigatório)
 * - month: number (para tipo monthly, obrigatório, 1-12)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar permissões
    const allowedRoles = ['OWNER', 'ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para visualizar resumos financeiros' },
        { status: 403 }
      )
    }

    // Ler query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro "type" é obrigatório (daily ou monthly)' },
        { status: 400 }
      )
    }

    if (type !== 'daily' && type !== 'monthly') {
      return NextResponse.json(
        { success: false, error: 'Parâmetro "type" deve ser "daily" ou "monthly"' },
        { status: 400 }
      )
    }

    // Processar resumo diário
    if (type === 'daily') {
      const dateParam = searchParams.get('date')
      console.log('Date received at summary route:', { dateParam })
      let date: Date | undefined

      if (dateParam) {
        try {
          date = new Date(`${dateParam}T00:00:00`)
          if (isNaN(date.getTime())) {
            return NextResponse.json(
              { success: false, error: 'Data inválida. Use formato ISO (YYYY-MM-DD)' },
              { status: 400 }
            )
          }
        } catch {
          return NextResponse.json(
            { success: false, error: 'Data inválida. Use formato ISO (YYYY-MM-DD)' },
            { status: 400 }
          )
        }
      }

      // Chamar use case para resumo diário
      const result = await getDailySummary({
        clinicId: session.user.clinicId,
        date
      })

      console.log('Daily summary result:', {
        date: date ? date.toISOString().split('T')[0] : 'today',
        clinicId: session.user.clinicId,
        response: result
      })

      if (result.success) {
        return NextResponse.json(result)
      } else {
        return NextResponse.json(result, { status: 400 })
      }
    }

    // Processar resumo mensal
    if (type === 'monthly') {
      const yearParam = searchParams.get('year')
      const monthParam = searchParams.get('month')

      if (!yearParam || !monthParam) {
        return NextResponse.json(
          { success: false, error: 'Parâmetros "year" e "month" são obrigatórios para resumo mensal' },
          { status: 400 }
        )
      }

      const year = parseInt(yearParam)
      const month = parseInt(monthParam)

      if (isNaN(year) || isNaN(month)) {
        return NextResponse.json(
          { success: false, error: 'Parâmetros "year" e "month" devem ser números válidos' },
          { status: 400 }
        )
      }

      // Chamar use case para resumo mensal
      const result = await getMonthlySummary({
        clinicId: session.user.clinicId,
        year,
        month
      })

      if (result.success) {
        return NextResponse.json(result)
      } else {
        return NextResponse.json(result, { status: 400 })
      }
    }

  } catch (error) {
    console.error('Erro ao obter resumo financeiro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}