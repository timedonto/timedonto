import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTreatmentPlan, updateTreatmentPlan } from '@/modules/treatment-plans/application'

/**
 * GET /api/treatment-plans/[id]
 * Busca um orçamento por ID
 * Permissão: todos autenticados
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

    const { id: treatmentPlanId } = await params

    console.log('GET treatment-plan:', {
      id: treatmentPlanId,
      clinicId: session.user.clinicId
    })

    // Chamar use case
    const result = await getTreatmentPlan({
      id: treatmentPlanId,
      clinicId: session.user.clinicId
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Erro GET treatment-plan:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/treatment-plans/[id]
 * Atualiza um orçamento (status e notes)
 * Permissão: OWNER, ADMIN, DENTIST (para aprovar/rejeitar)
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

    const { id: treatmentPlanId } = await params

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

    console.log('PATCH treatment-plan:', {
      id: treatmentPlanId,
      clinicId: session.user.clinicId,
      body
    })

    // Verificar permissões para alteração de status
    if (body.status && body.status !== 'OPEN') {
      const allowedRoles = ['OWNER', 'ADMIN', 'DENTIST']
      if (!allowedRoles.includes(session.user.role)) {
        return NextResponse.json(
          { success: false, error: 'Você não tem permissão para aprovar ou rejeitar orçamentos' },
          { status: 403 }
        )
      }
    }

    // Chamar use case
    const result = await updateTreatmentPlan({
      id: treatmentPlanId,
      clinicId: session.user.clinicId,
      data: body,
      userRole: session.user.role
    })

    // Retornar resultado
    if (result.success) {
      return NextResponse.json(result)
    } else {
      // Determinar status code baseado no tipo de erro
      let statusCode = 400
      
      if (result.error?.includes('não encontrado')) {
        statusCode = 404
      } else if (result.error?.includes('não tem permissão')) {
        statusCode = 403
      }

      return NextResponse.json(result, { status: statusCode })
    }

  } catch (error) {
    console.error('Erro PATCH treatment-plan:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}