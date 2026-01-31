import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/roles'
import { auth } from '@/lib/auth'
import { updateUser, getUserSchema } from '@/modules/users/application'
import { userRepository } from '@/modules/users/infra/user.repository'

/**
 * GET /api/users/[id]
 * Busca um usuário por ID
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

    const { id: userId } = await params

    // Validar ID (deve ser CUID válido)
    const idValidation = getUserSchema.safeParse({ id: userId })
    if (!idValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `ID inválido: ${idValidation.error.issues.map(i => i.message).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Verificar permissão: apenas OWNER/ADMIN ou o próprio usuário
    const userRole = session.user.role as UserRole
    const isOwnProfile = session.user.id === userId
    const hasAdminAccess = userRole === UserRole.OWNER || userRole === UserRole.ADMIN

    if (!hasAdminAccess && !isOwnProfile) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      )
    }

    // Buscar usuário
    const user = await userRepository.findById(userId, session.user.clinicId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/[id]
 * Atualiza um usuário
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.clinicId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id: userId } = await params
    const userRole = session.user.role as UserRole

    // Validar ID (deve ser CUID válido)
    const idValidation = getUserSchema.safeParse({ id: userId })
    if (!idValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `ID inválido: ${idValidation.error.issues.map(i => i.message).join(', ')}` 
        },
        { status: 400 }
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

    // Validar clinicId
    const { updateUserWithIdSchema } = await import('@/modules/users/application')
    const clinicIdValidation = updateUserWithIdSchema.safeParse({
      id: userId,
      data: body
    })

    if (!clinicIdValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Dados inválidos: ${clinicIdValidation.error.issues.map(i => i.message).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Chamar use case
    const result = await updateUser({
      userId,
      clinicId: session.user.clinicId,
      currentUserId: session.user.id,
      currentUserRole: userRole,
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
      } else if (result.error?.includes('Permissão') || result.error?.includes('não podem')) {
        statusCode = 403
      }

      return NextResponse.json(result, { status: statusCode })
    }

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Desativa um usuário (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.clinicId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id: userId } = await params
    const userRole = session.user.role as UserRole

    // Validar ID (deve ser CUID válido)
    const idValidation = getUserSchema.safeParse({ id: userId })
    if (!idValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `ID inválido: ${idValidation.error.issues.map(i => i.message).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Chamar use case de atualização para desativar
    const result = await updateUser({
      userId,
      clinicId: session.user.clinicId,
      currentUserId: session.user.id,
      currentUserRole: userRole,
      data: { isActive: false }
    })

    // Retornar resultado
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Usuário desativado com sucesso'
      })
    } else {
      // Determinar status code baseado no tipo de erro
      let statusCode = 400

      if (result.error?.includes('não encontrado')) {
        statusCode = 404
      } else if (result.error?.includes('Permissão') || result.error?.includes('não podem')) {
        statusCode = 403
      }

      return NextResponse.json(result, { status: statusCode })
    }

  } catch (error) {
    console.error('Erro ao desativar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}