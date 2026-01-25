import { NextResponse } from 'next/server'
import { requireAuth } from '@/modules/auth/application'
import { getDashboardDataUseCase } from '@/modules/dashboard/application'
import { z } from 'zod'

/**
 * GET /api/dashboard
 * Retorna dados completos do dashboard para a clínica logada
 */
export async function GET() {
  try {
    const user = await requireAuth()
    
    if (!user.clinicId) {
      return NextResponse.json(
        { success: false, error: 'Clínica não associada ao usuário' },
        { status: 400 }
      )
    }
    
    const dashboardData = await getDashboardDataUseCase.execute(user.clinicId)
    
    return NextResponse.json({
      success: true,
      data: dashboardData
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    
    if (error instanceof Error && error.message === 'Usuário não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Retornar mensagem de erro mais específica se disponível
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erro interno do servidor'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}