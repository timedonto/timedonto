import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { specialtyRepository } from '@/modules/specialties/infra/specialty.repository'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar todas as especialidades (globais)
    const specialties = await specialtyRepository.findMany()

    return NextResponse.json(specialties)
  } catch (error) {
    console.error('Erro ao buscar especialidades:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}