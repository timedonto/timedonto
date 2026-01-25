import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { listDentists, createDentist, listDentistsWithClinicSchema } from '@/modules/dentists/application'

/**
 * GET /api/dentists
 * Lista dentistas da clínica com filtros opcionais
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

    const specialty = searchParams.get('specialty')
    if (specialty) {
      filters.specialty = specialty.trim()
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search.trim()
    }

    // Validar clinicId
    const clinicIdValidation = listDentistsWithClinicSchema.safeParse({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
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
    const result = await listDentists({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao listar dentistas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dentists
 * Cria um novo dentista
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

    // Verificar permissão (OWNER ou ADMIN)
    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
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

    // Validar clinicId
    const { createDentistWithClinicSchema } = await import('@/modules/dentists/application')
    const clinicIdValidation = createDentistWithClinicSchema.safeParse({
      clinicId: session.user.clinicId,
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

    // Validação adicional: verificar se usuário já é dentista (proteção extra)
    if (body.userId) {
      const { dentistRepository } = await import('@/modules/dentists/infra/dentist.repository')
      const isAlreadyDentist = await dentistRepository.userIsDentist(body.userId, session.user.clinicId)
      
      if (isAlreadyDentist) {
        return NextResponse.json({
          success: false,
          error: 'Este usuário já está cadastrado como dentista. Operação não permitida.'
        }, { status: 409 }) // Conflict
      }
    }

    // Chamar use case
    const result = await createDentist({
      clinicId: session.user.clinicId,
      currentUserRole: userRole,
      data: body
    })

    // Retornar resultado
    if (result.success) {
      return NextResponse.json({
        success: result.success,
        data: result.data
      }, { status: 201 })
    } else {
      // Determinar status code baseado no tipo de erro
      let statusCode = 400
      if (result.error?.includes('Permissão') || result.error?.includes('não podem')) {
        statusCode = 403
      }
      return NextResponse.json(result, { status: statusCode })
    }

  } catch (error) {
    console.error('Erro ao criar dentista:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}