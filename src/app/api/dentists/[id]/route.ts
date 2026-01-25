import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { updateDentist, getDentistSchema } from '@/modules/dentists/application'
import { dentistRepository } from '@/modules/dentists/infra/dentist.repository'

/**
 * GET /api/dentists/[id]
 * Busca um dentista por ID
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

    const { id: dentistId } = await params

    // Validar ID (deve ser CUID válido)
    const idValidation = getDentistSchema.safeParse({ id: dentistId })
    if (!idValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `ID inválido: ${idValidation.error.issues.map(i => i.message).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Buscar dentista
    const dentist = await dentistRepository.findById(dentistId, session.user.clinicId)

    if (!dentist) {
      return NextResponse.json(
        { success: false, error: 'Dentista não encontrado' },
        { status: 404 }
      )
    }

    // Controle de acesso: apenas OWNER/ADMIN ou o próprio dentista
    const userRole = session.user.role as UserRole
    const isOwnerOrAdmin = userRole === UserRole.OWNER || userRole === UserRole.ADMIN
    const isOwnProfile = session.user.id === dentist.userId

    if (!isOwnerOrAdmin && !isOwnProfile) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: dentist
    })

  } catch (error) {
    console.error('Erro ao buscar dentista:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/dentists/[id]
 * Atualiza um dentista
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

    const { id: dentistId } = await params

    // Validar ID (deve ser CUID válido)
    const idValidation = getDentistSchema.safeParse({ id: dentistId })
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
    const { updateDentistWithIdSchema } = await import('@/modules/dentists/application')
    const clinicIdValidation = updateDentistWithIdSchema.safeParse({
      id: dentistId,
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
    const result = await updateDentist({
      dentistId,
      clinicId: session.user.clinicId,
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
    console.error('Erro ao atualizar dentista:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/dentists/[id]
 * Remove um dentista
 */
export async function DELETE(
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

    const { id: dentistId } = await params

    // Validar ID (deve ser CUID válido)
    const idValidation = getDentistSchema.safeParse({ id: dentistId })
    if (!idValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `ID inválido: ${idValidation.error.issues.map(i => i.message).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Verificar se dentista existe antes de tentar deletar
    const existingDentist = await dentistRepository.findById(dentistId, session.user.clinicId)
    if (!existingDentist) {
      return NextResponse.json(
        { success: false, error: 'Dentista não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se pode deletar (sem vínculos)
    const canDeleteCheck = await dentistRepository.canDelete(dentistId, session.user.clinicId)
    if (!canDeleteCheck.canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: `Não é possível excluir dentista. ${canDeleteCheck.reason}`
        },
        { status: 400 }
      )
    }

    // Deletar dentista
    const success = await dentistRepository.delete(dentistId, session.user.clinicId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Dentista removido com sucesso'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Erro ao remover dentista' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro ao deletar dentista:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}