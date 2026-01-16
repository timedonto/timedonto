import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPatient, updatePatient } from '@/modules/patients/application'

/**
 * GET /api/patients/[id]
 * Busca um paciente por ID
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

    // Aguardar parâmetros
    const resolvedParams = await params
    const patientId = resolvedParams.id
    console.log('🔥 API DEBUG - URL da requisição:', request.url) // Debug
    console.log('🔥 API DEBUG - Params resolvidos:', resolvedParams) // Debug
    console.log('🔥 API DEBUG - ID do paciente:', patientId) // Debug
    console.log('🔥 API DEBUG - Clinic ID da sessão:', session.user.clinicId) // Debug

    // Chamar use case
    const result = await getPatient({
      id: patientId,
      clinicId: session.user.clinicId
    })

    console.log('🔥 API DEBUG - Sucesso do use case:', result.success) // Debug
    console.log('🔥 API DEBUG - Dados retornados:', result.data) // Debug
    console.log('🔥 API DEBUG - Nome do paciente:', result.data?.name) // Debug

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Erro ao buscar paciente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/patients/[id]
 * Atualiza um paciente
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

    // Aguardar parâmetros
    const resolvedParams = await params
    const patientId = resolvedParams.id

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
    const result = await updatePatient({
      id: patientId,
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
    console.error('Erro ao atualizar paciente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}