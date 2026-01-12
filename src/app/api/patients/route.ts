import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listPatients, createPatient } from '@/modules/patients/application'

/**
 * GET /api/patients
 * Lista pacientes da clínica com filtros opcionais
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

    const isActive = searchParams.get('isActive')
    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search.trim()
    }

    // Chamar use case
    const result = await listPatients({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao listar pacientes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/patients
 * Cria um novo paciente
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
    const result = await createPatient({
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
    console.error('Erro ao criar paciente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}