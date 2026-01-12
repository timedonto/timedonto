import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { updateDentist } from '@/modules/dentists/application'
import { dentistRepository } from '@/modules/dentists/infra/dentist.repository'

/**
 * GET /api/dentists/[id]
 * Busca um dentista por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const dentistId = params.id

    // Buscar dentista
    const dentist = await dentistRepository.findById(dentistId, session.user.clinicId)

    if (!dentist) {
      return NextResponse.json(
        { success: false, error: 'Dentista não encontrado' },
        { status: 404 }
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
  { params }: { params: { id: string } }
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

    const dentistId = params.id

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
  { params }: { params: { id: string } }
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

    const dentistId = params.id

    // Verificar se dentista existe antes de tentar deletar
    const existingDentist = await dentistRepository.findById(dentistId, session.user.clinicId)
    if (!existingDentist) {
      return NextResponse.json(
        { success: false, error: 'Dentista não encontrado' },
        { status: 404 }
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