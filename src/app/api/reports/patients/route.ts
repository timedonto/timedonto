import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * GET /api/reports/patients
 * Retorna estatísticas e relatório de pacientes da clínica
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
    const isActiveFilter = searchParams.get('isActive')
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Construir filtros para a consulta
    const where: any = {
      clinicId
    }

    if (isActiveFilter !== null) {
      where.isActive = isActiveFilter === 'true'
    }

    if (fromParam || toParam) {
      where.createdAt = {}
      
      if (fromParam) {
        try {
          where.createdAt.gte = new Date(fromParam)
        } catch {
          return NextResponse.json(
            { success: false, error: 'Parâmetro "from" deve ser uma data válida' },
            { status: 400 }
          )
        }
      }
      
      if (toParam) {
        try {
          where.createdAt.lte = new Date(toParam)
        } catch {
          return NextResponse.json(
            { success: false, error: 'Parâmetro "to" deve ser uma data válida' },
            { status: 400 }
          )
        }
      }
    }

    // Buscar pacientes com filtros aplicados
    const patients = await prisma.patient.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        isActive: true,
        createdAt: true
      },
      orderBy: [
        { isActive: 'desc' }, // Ativos primeiro
        { createdAt: 'desc' }  // Depois por data de criação
      ]
    })

    // Buscar todos os pacientes para estatísticas gerais (sem filtros)
    const allPatients = await prisma.patient.findMany({
      where: {
        clinicId
      },
      select: {
        isActive: true,
        createdAt: true
      }
    })

    // Calcular datas para estatísticas mensais
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-11

    // Início do mês atual
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1)
    // Início do mês anterior
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1)
    // Fim do mês anterior
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)

    // Calcular estatísticas
    const total = allPatients.length
    const active = allPatients.filter(patient => patient.isActive).length
    const inactive = allPatients.filter(patient => !patient.isActive).length

    // Pacientes novos no mês atual
    const newThisMonth = allPatients.filter(patient => 
      patient.createdAt >= startOfCurrentMonth
    ).length

    // Pacientes novos no mês anterior
    const newLastMonth = allPatients.filter(patient => 
      patient.createdAt >= startOfLastMonth && patient.createdAt <= endOfLastMonth
    ).length

    // Calcular contagem por mês (últimos 6 meses)
    const byMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1)
      const nextMonthDate = new Date(currentYear, currentMonth - i + 1, 1)
      
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      
      const count = allPatients.filter(patient => 
        patient.createdAt >= monthDate && patient.createdAt < nextMonthDate
      ).length

      byMonth.push({
        month: monthStr,
        count
      })
    }

    // Retornar dados do relatório
    const reportData = {
      total,
      active,
      inactive,
      newThisMonth,
      newLastMonth,
      byMonth,
      patients
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error('Erro ao gerar relatório de pacientes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}