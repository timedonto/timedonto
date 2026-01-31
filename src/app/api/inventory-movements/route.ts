import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/roles'
import { auth } from '@/lib/auth'
import { listInventoryMovements, createInventoryMovement } from '@/modules/inventory/application'

/**
 * GET /api/inventory-movements
 * Lista movimentações de estoque da clínica com filtros opcionais
 * Permissão: OWNER, ADMIN, RECEPTIONIST
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

    // Verificar permissão (OWNER, ADMIN ou RECEPTIONIST)
    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN && userRole !== UserRole.RECEPTIONIST) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      )
    }

    // Ler query parameters
    const { searchParams } = new URL(request.url)
    const filters: any = {}

    const itemId = searchParams.get('itemId')
    if (itemId) {
      filters.itemId = itemId.trim()
    }

    const type = searchParams.get('type')
    if (type && (type === 'IN' || type === 'OUT')) {
      filters.type = type
    }

    const from = searchParams.get('from')
    if (from) {
      try {
        // Validar se é uma data ISO válida
        new Date(from).toISOString()
        filters.from = from
      } catch {
        return NextResponse.json(
          { success: false, error: 'Parâmetro "from" deve ser uma data ISO válida' },
          { status: 400 }
        )
      }
    }

    const to = searchParams.get('to')
    if (to) {
      try {
        // Validar se é uma data ISO válida
        new Date(to).toISOString()
        filters.to = to
      } catch {
        return NextResponse.json(
          { success: false, error: 'Parâmetro "to" deve ser uma data ISO válida' },
          { status: 400 }
        )
      }
    }

    // Chamar use case
    const result = await listInventoryMovements({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao listar movimentações de estoque:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory-movements
 * Cria uma nova movimentação de estoque
 * Permissão: OWNER, ADMIN para qualquer operação; RECEPTIONIST apenas para OUT
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.clinicId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
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

    // Verificar permissões baseadas no tipo de operação
    const userRole = session.user.role as UserRole
    const operationType = body.type

    if (operationType === 'IN') {
      // Entrada: apenas OWNER e ADMIN
      if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
        return NextResponse.json(
          { success: false, error: 'Apenas OWNER e ADMIN podem registrar entradas de estoque' },
          { status: 403 }
        )
      }
    } else if (operationType === 'OUT') {
      // Saída: OWNER, ADMIN e RECEPTIONIST
      if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN && userRole !== UserRole.RECEPTIONIST) {
        return NextResponse.json(
          { success: false, error: 'Permissão insuficiente para registrar saídas de estoque' },
          { status: 403 }
        )
      }
    } else {
      // Tipo inválido ou não informado
      return NextResponse.json(
        { success: false, error: 'Tipo de movimentação deve ser "IN" ou "OUT"' },
        { status: 400 }
      )
    }

    // Chamar use case
    const result = await createInventoryMovement({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      data: body
    })

    // Retornar resultado
    if (result.success) {
      return NextResponse.json(result, { status: 201 })
    } else {
      // Determinar status code baseado no tipo de erro
      let statusCode = 400
      
      if (result.error?.includes('não encontrado')) {
        statusCode = 404
      } else if (result.error?.includes('insuficiente')) {
        statusCode = 409 // Conflict - estoque insuficiente
      }

      return NextResponse.json(result, { status: statusCode })
    }

  } catch (error) {
    console.error('Erro ao criar movimentação de estoque:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}