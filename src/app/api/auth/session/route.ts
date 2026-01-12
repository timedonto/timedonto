import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * GET /api/auth/session
 * Retorna dados da sessão atual do usuário
 */
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        clinicId: session.user.clinicId,
        clinicName: session.user.clinicName
      }
    })
  } catch (error) {
    console.error('Erro ao buscar sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}