import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/roles'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * GET /api/reports/users
 * Retorna estatísticas e relatório de usuários da clínica
 * Permissão: OWNER, ADMIN
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

    const clinicId = session.user.clinicId

    // Ler query parameters para filtros opcionais
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')
    const isActiveFilter = searchParams.get('isActive')

    // Construir filtros para a consulta
    const where: any = {
      clinicId
    }

    if (roleFilter && Object.values(UserRole).includes(roleFilter as UserRole)) {
      where.role = roleFilter as UserRole
    }

    if (isActiveFilter !== null) {
      where.isActive = isActiveFilter === 'true'
    }

    // Buscar usuários com filtros aplicados
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: [
        { isActive: 'desc' }, // Ativos primeiro
        { name: 'asc' }       // Depois por nome
      ]
    })

    // Buscar estatísticas gerais (sem filtros para ter dados completos)
    const allUsers = await prisma.user.findMany({
      where: {
        clinicId
      },
      select: {
        role: true,
        isActive: true
      }
    })

    // Calcular estatísticas
    const total = allUsers.length
    const active = allUsers.filter(user => user.isActive).length
    const inactive = allUsers.filter(user => !user.isActive).length

    // Contar por role
    const byRole = {
      OWNER: allUsers.filter(user => user.role === UserRole.OWNER).length,
      ADMIN: allUsers.filter(user => user.role === UserRole.ADMIN).length,
      DENTIST: allUsers.filter(user => user.role === UserRole.DENTIST).length,
      RECEPTIONIST: allUsers.filter(user => user.role === UserRole.RECEPTIONIST).length
    }

    // Retornar dados do relatório
    const reportData = {
      total,
      byRole,
      active,
      inactive,
      users
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error('Erro ao gerar relatório de usuários:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}