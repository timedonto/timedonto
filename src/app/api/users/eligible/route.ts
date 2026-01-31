import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/roles'
import { auth } from '@/lib/auth'
import { listEligibleUsers } from '@/modules/users/application'

/**
 * GET /api/users/eligible
 * Lista usuários elegíveis para se tornarem dentistas
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

    // Chamar use case
    const result = await listEligibleUsers({
      clinicId: session.user.clinicId
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao listar usuários elegíveis:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}