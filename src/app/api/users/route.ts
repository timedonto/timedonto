import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/roles'
import { auth } from '@/lib/auth'
import { listUsers, createUser, listUsersWithClinicSchema } from '@/modules/users/application'

/**
 * GET /api/users
 * Lista usuários da clínica com filtros opcionais
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

    // Verificar permissão (OWNER ou ADMIN)
    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      )
    }

    // Ler e validar query parameters
    const { searchParams } = new URL(request.url)
    const filters: any = {}

    const role = searchParams.get('role')
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      filters.role = role as UserRole
    }

    const isActive = searchParams.get('isActive')
    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search.trim()
    }

    // Validar clinicId
    const clinicIdValidation = listUsersWithClinicSchema.safeParse({
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
    const result = await listUsers({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Cria um novo usuário
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
    const { createUserWithClinicSchema } = await import('@/modules/users/application')
    const clinicIdValidation = createUserWithClinicSchema.safeParse({
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

    // Chamar use case
    const result = await createUser({
      clinicId: session.user.clinicId,
      currentUserRole: userRole,
      data: body
    })

    // Retornar resultado
    if (result.success) {
      return NextResponse.json(result, { status: 201 })
    } else {
      // Determinar status code baseado no tipo de erro
      let statusCode = 400
      if (result.error?.includes('Permissão') || result.error?.includes('não podem')) {
        statusCode = 403
      }
      return NextResponse.json(result, { status: statusCode })
    }

  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}