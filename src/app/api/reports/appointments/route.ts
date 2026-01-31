import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/roles'
import { AppointmentStatus } from '@/types/appointments'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * GET /api/reports/appointments
 * Retorna estatísticas de agendamentos da clínica
 * Permissão: OWNER, ADMIN, DENTIST (dentista vê apenas os próprios dados)
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

    // Verificar permissão (OWNER, ADMIN ou DENTIST)
    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN && userRole !== UserRole.DENTIST) {
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
    const dentistIdParam = searchParams.get('dentistId')
    const statusParam = searchParams.get('status')

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
      date: {
        gte: fromDate,
        lte: toDate
      }
    }

    // Se for dentista, filtrar apenas seus agendamentos
    if (userRole === UserRole.DENTIST) {
      // Buscar dentist associado ao usuário
      const dentist = await prisma.dentist.findFirst({
        where: {
          userId: session.user.id,
          clinicId
        },
        select: { id: true }
      })

      if (!dentist) {
        return NextResponse.json(
          { success: false, error: 'Dentista não encontrado' },
          { status: 404 }
        )
      }

      where.dentistId = dentist.id
    } else if (dentistIdParam) {
      // Filtro por dentista específico (apenas para OWNER/ADMIN)
      where.dentistId = dentistIdParam
    }

    // Filtro por status
    if (statusParam && Object.values(AppointmentStatus).includes(statusParam as AppointmentStatus)) {
      where.status = statusParam as AppointmentStatus
    }

    // Buscar agendamentos no período com filtros aplicados
    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        date: true,
        status: true,
        dentistId: true,
        dentist: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        procedure: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calcular estatísticas básicas
    const total = appointments.length

    // Contagem por status
    const byStatus = {
      SCHEDULED: 0,
      CONFIRMED: 0,
      CANCELED: 0,
      RESCHEDULED: 0,
      NO_SHOW: 0,
      DONE: 0
    }

    appointments.forEach(appointment => {
      byStatus[appointment.status]++
    })

    // Calcular taxa de comparecimento
    const totalFinalized = byStatus.DONE + byStatus.NO_SHOW + byStatus.CANCELED
    const attendanceRate = totalFinalized > 0 ? (byStatus.DONE / totalFinalized) * 100 : 0

    // Agrupar por dentista
    const dentistTotals = new Map<string, { name: string, total: number, done: number, canceled: number, noShow: number }>()

    appointments.forEach(appointment => {
      const dentistId = appointment.dentistId
      const dentistName = appointment.dentist?.user?.name || 'Dentista não encontrado'
      
      const existing = dentistTotals.get(dentistId) || {
        name: dentistName,
        total: 0,
        done: 0,
        canceled: 0,
        noShow: 0
      }
      
      existing.total++
      if (appointment.status === 'DONE') existing.done++
      if (appointment.status === 'CANCELED') existing.canceled++
      if (appointment.status === 'NO_SHOW') existing.noShow++
      
      dentistTotals.set(dentistId, existing)
    })

    const byDentist = Array.from(dentistTotals.entries())
      .map(([dentistId, data]) => ({
        dentistId,
        dentistName: data.name,
        total: data.total,
        done: data.done,
        canceled: data.canceled,
        noShow: data.noShow
      }))
      .sort((a, b) => b.total - a.total)

    // Análise de dias da semana mais movimentados
    const dayOfWeekCounts = new Array(7).fill(0)
    appointments.forEach(appointment => {
      const dayOfWeek = appointment.date.getDay()
      dayOfWeekCounts[dayOfWeek]++
    })

    const busiestDays = dayOfWeekCounts
      .map((count, dayOfWeek) => ({ dayOfWeek, count }))
      .sort((a, b) => b.count - a.count)

    // Análise de horários mais movimentados
    const hourCounts = new Array(24).fill(0)
    appointments.forEach(appointment => {
      const hour = appointment.date.getHours()
      hourCounts[hour]++
    })

    const busiestHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > 0) // Apenas horários com agendamentos
      .sort((a, b) => b.count - a.count)

    // Calcular agendamentos do mês atual e anterior
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1)
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)

    // Buscar agendamentos do mês atual
    const thisMonthAppointments = await prisma.appointment.count({
      where: {
        clinicId,
        date: {
          gte: startOfCurrentMonth
        },
        ...(userRole === UserRole.DENTIST && { dentistId: where.dentistId })
      }
    })

    // Buscar agendamentos do mês anterior
    const lastMonthAppointments = await prisma.appointment.count({
      where: {
        clinicId,
        date: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        },
        ...(userRole === UserRole.DENTIST && { dentistId: where.dentistId })
      }
    })

    // Buscar próximos agendamentos (status SCHEDULED ou CONFIRMED)
    const upcoming = await prisma.appointment.findMany({
      where: {
        clinicId,
        date: {
          gte: now
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        },
        ...(userRole === UserRole.DENTIST && { dentistId: where.dentistId })
      },
      select: {
        id: true,
        date: true,
        status: true,
        procedure: true,
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        dentist: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 10
    })

    // Retornar dados do relatório
    const reportData = {
      total,
      byStatus,
      byDentist,
      attendanceRate: Number(attendanceRate.toFixed(2)),
      busiestDays,
      busiestHours,
      thisMonth: thisMonthAppointments,
      lastMonth: lastMonthAppointments,
      upcoming: upcoming.map(appointment => ({
        id: appointment.id,
        date: appointment.date,
        status: appointment.status,
        procedure: appointment.procedure,
        patientName: appointment.patient?.name || 'Paciente não encontrado',
        dentistName: appointment.dentist?.user?.name || 'Dentista não encontrado'
      }))
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error('Erro ao gerar relatório de agendamentos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}