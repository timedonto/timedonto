import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listTreatmentPlans, createTreatmentPlan } from '@/modules/treatment-plans/application'

/**
 * GET /api/treatment-plans
 * Lista orçamentos da clínica com filtros opcionais
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

    const patientId = searchParams.get('patientId')
    if (patientId && patientId.trim() !== '' && patientId !== 'null' && patientId !== 'undefined') {
      filters.patientId = patientId.trim()
    }

    const dentistId = searchParams.get('dentistId')
    if (dentistId && dentistId.trim() !== '' && dentistId !== 'null' && dentistId !== 'undefined') {
      filters.dentistId = dentistId.trim()
    }

    const status = searchParams.get('status')
    if (status && status.trim() !== '') {
      filters.status = status.trim()
    }

    // Chamar use case
    const result = await listTreatmentPlans({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao listar orçamentos:', error)

    // Se for um erro de validação (contém "Filtros inválidos") ou outra mensagem conhecida
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor'
    const isValidationError = errorMessage.includes('inválidos') || errorMessage.includes('CUID')

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: isValidationError ? 400 : 500 }
    )
  }
}

/**
 * POST /api/treatment-plans
 * Cria um novo orçamento
 * Permissão: OWNER, ADMIN, DENTIST
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

    // Verificar permissões
    const allowedRoles = ['OWNER', 'ADMIN', 'DENTIST']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para criar orçamentos' },
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
    const result = await createTreatmentPlan({
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
    console.error('Erro ao criar orçamento:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}