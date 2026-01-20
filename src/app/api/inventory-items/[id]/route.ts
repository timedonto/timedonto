import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { getInventoryItem, updateInventoryItem } from '@/modules/inventory/application'

/**
 * GET /api/inventory-items/[id]
 * Busca um item de estoque por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id: itemId } = await params

    // Chamar use case
    const result = await getInventoryItem({
      id: itemId,
      clinicId: session.user.clinicId
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: 'Item de estoque não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Erro ao buscar item de estoque:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/inventory-items/[id]
 * Atualiza um item de estoque
 * Permissão: OWNER, ADMIN
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: itemId } = await params

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
    const result = await updateInventoryItem({
      id: itemId,
      clinicId: session.user.clinicId,
      data: body
    })

    // Retornar resultado
    if (result.success) {
      return NextResponse.json(result)
    } else {
      // Determinar status code baseado no tipo de erro
      let statusCode = 400

      if (result.error?.includes('não encontrado')) {
        statusCode = 404
      }

      return NextResponse.json(result, { status: statusCode })
    }

  } catch (error) {
    console.error('Erro ao atualizar item de estoque:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}