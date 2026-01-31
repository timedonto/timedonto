import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/roles'
import { PaymentMethod } from '@/types/finance'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * GET /api/reports/finance
 * Retorna estatísticas financeiras da clínica
 * Permissão: OWNER, ADMIN
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

    // Verificar permissão (OWNER ou ADMIN)
    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      )
    }

    const clinicId = session.user.clinicId

    // Ler query parameters para filtros opcionais
    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const methodParam = searchParams.get('method')

    // Definir período padrão (mês atual se não informado)
    const now = new Date()
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1) // Primeiro dia do mês atual
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) // Último dia do mês atual

    let fromDate = defaultFrom
    let toDate = defaultTo

    // Validar e aplicar filtros de período
    if (fromParam) {
      try {
        fromDate = new Date(fromParam)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Parâmetro "from" deve ser uma data válida' },
          { status: 400 }
        )
      }
    }

    if (toParam) {
      try {
        toDate = new Date(toParam)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Parâmetro "to" deve ser uma data válida' },
          { status: 400 }
        )
      }
    }

    // Construir filtros para a consulta
    const where: any = {
      clinicId,
      createdAt: {
        gte: fromDate,
        lte: toDate
      }
    }

    // Filtro por método de pagamento
    if (methodParam && Object.values(PaymentMethod).includes(methodParam as PaymentMethod)) {
      where.method = methodParam as PaymentMethod
    }

    // Buscar pagamentos no período com filtros aplicados
    const payments = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        method: true,
        createdAt: true,
        patientId: true,
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcular total recebido
    const totalReceived = payments.reduce((sum, payment) => {
      return sum + Number(payment.amount)
    }, 0)

    // Calcular totais por método
    const byMethod = {
      CASH: 0,
      PIX: 0,
      CARD: 0
    }

    payments.forEach(payment => {
      byMethod[payment.method] += Number(payment.amount)
    })

    // Calcular quantidade de pagamentos
    const paymentCount = payments.length

    // Calcular média diária
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) || 1
    const dailyAverage = totalReceived / daysDiff

    // Buscar dados para análise mensal (últimos 6 meses)
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const byMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1)
      const nextMonthDate = new Date(currentYear, currentMonth - i + 1, 1)
      
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      
      // Buscar pagamentos do mês
      const monthPayments = await prisma.payment.findMany({
        where: {
          clinicId,
          createdAt: {
            gte: monthDate,
            lt: nextMonthDate
          }
        },
        select: {
          amount: true
        }
      })

      const monthTotal = monthPayments.reduce((sum, payment) => {
        return sum + Number(payment.amount)
      }, 0)

      byMonth.push({
        month: monthStr,
        total: monthTotal,
        count: monthPayments.length
      })
    }

    // Calcular top 5 pacientes que mais pagaram no período
    const patientTotals = new Map<string, { name: string, total: number, count: number }>()

    payments.forEach(payment => {
      if (payment.patientId && payment.patient) {
        const existing = patientTotals.get(payment.patientId) || {
          name: payment.patient.name,
          total: 0,
          count: 0
        }
        
        existing.total += Number(payment.amount)
        existing.count += 1
        
        patientTotals.set(payment.patientId, existing)
      }
    })

    const topPatients = Array.from(patientTotals.entries())
      .map(([patientId, data]) => ({
        patientId,
        patientName: data.name,
        total: data.total,
        count: data.count
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Retornar dados do relatório
    const reportData = {
      totalReceived: Number(totalReceived.toFixed(2)),
      byMethod: {
        CASH: Number(byMethod.CASH.toFixed(2)),
        PIX: Number(byMethod.PIX.toFixed(2)),
        CARD: Number(byMethod.CARD.toFixed(2))
      },
      byMonth,
      dailyAverage: Number(dailyAverage.toFixed(2)),
      paymentCount,
      topPatients: topPatients.map(patient => ({
        ...patient,
        total: Number(patient.total.toFixed(2))
      }))
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}