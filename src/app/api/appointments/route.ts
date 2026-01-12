import { NextRequest, NextResponse } from 'next/server'
import { UserRole, AppointmentStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { listAppointments, createAppointment } from '@/modules/appointments/application'

/**
 * GET /api/appointments
 * Lista agendamentos da clínica com filtros opcionais
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

    // Ler query parameters
    const { searchParams } = new URL(request.url)
    const filters: any = {}

    const dentistId = searchParams.get('dentistId')
    if (dentistId) {
      filters.dentistId = dentistId.trim()
    }

    const patientId = searchParams.get('patientId')
    if (patientId) {
      filters.patientId = patientId.trim()
    }

    const date = searchParams.get('date')
    if (date) {
      filters.date = date.trim()
    }

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) {
      filters.dateFrom = dateFrom.trim()
    }

    const dateTo = searchParams.get('dateTo')
    if (dateTo) {
      filters.dateTo = dateTo.trim()
    }

    const status = searchParams.get('status')
    if (status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      filters.status = status as AppointmentStatus
    }

    // Chamar use case
    const result = await listAppointments({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao listar agendamentos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointments
 * Cria um novo agendamento
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar permissão (OWNER, ADMIN ou RECEPTIONIST)
    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN && userRole !== UserRole.RECEPTIONIST) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      )
    }

    // Ler e validar body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body da requisição inválido' },
        { status: 400 }
      )
    }

    // Chamar use case
    const result = await createAppointment({
      clinicId: session.user.clinicId,
      data: body
    })

    // Retornar resultado
    if (result.success) {
      return NextResponse.json(result, { status: 201 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }

  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}