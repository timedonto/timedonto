import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listPayments, createPayment } from '@/modules/finance/application'

/**
 * GET /api/payments
 * Lista pagamentos da clínica com filtros opcionais
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

    // Verificar permissões
    const allowedRoles = ['OWNER', 'ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para visualizar pagamentos' },
        { status: 403 }
      )
    }

    // Ler query parameters
    const { searchParams } = new URL(request.url)
    const filters: any = {}

    const patientId = searchParams.get('patientId')
    if (patientId) {
      filters.patientId = patientId.trim()
    }

    const method = searchParams.get('method')
    if (method) {
      filters.method = method.trim()
    }

    const startDate = searchParams.get('startDate')
    if (startDate) {
      filters.startDate = startDate.trim()
    }

    const endDate = searchParams.get('endDate')
    if (endDate) {
      filters.endDate = endDate.trim()
    }

    // Chamar use case
    const result = await listPayments({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao listar pagamentos:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payments
 * Cria um novo pagamento
 * Permissão: OWNER, ADMIN, RECEPTIONIST
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
    const allowedRoles = ['OWNER', 'ADMIN', 'RECEPTIONIST']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para criar pagamentos' },
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
    const result = await createPayment({
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
    console.error('Erro ao criar pagamento:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}