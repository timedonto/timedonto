import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/roles'
import { InventoryMovementType } from '@/types/inventory'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * GET /api/reports/inventory
 * Retorna estatísticas de estoque da clínica
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
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Definir período padrão (mês atual se não informado) para movimentações
    const now = new Date()
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1) // Primeiro dia do mês atual
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) // Último dia do mês atual

    let fromDate = defaultFrom
    let toDate = defaultTo

    // Validar e aplicar filtros de período
    if (fromParam) {
      try {
        fromDate = new Date(fromParam)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Parâmetro "from" deve ser uma data válida' },
          { status: 400 }
        )
      }
    }

    if (toParam) {
      try {
        toDate = new Date(toParam)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Parâmetro "to" deve ser uma data válida' },
          { status: 400 }
        )
      }
    }

    // Buscar todos os itens de estoque para estatísticas gerais
    const allItems = await prisma.inventoryItem.findMany({
      where: {
        clinicId
      },
      select: {
        id: true,
        name: true,
        currentQuantity: true,
        minQuantity: true,
        unit: true,
        isActive: true
      }
    })

    // Calcular estatísticas de itens
    const totalItems = allItems.length
    const activeItems = allItems.filter(item => item.isActive).length
    const inactiveItems = allItems.filter(item => !item.isActive).length
    const outOfStockItems = allItems.filter(item => item.currentQuantity === 0).length

    // Itens com estoque baixo (currentQuantity <= minQuantity)
    const lowStockItems = allItems.filter(item => 
      item.minQuantity !== null && item.currentQuantity <= item.minQuantity
    ).length

    // Lista detalhada de itens com estoque baixo
    const itemsLowStock = allItems
      .filter(item => item.minQuantity !== null && item.currentQuantity <= item.minQuantity)
      .map(item => ({
        id: item.id,
        name: item.name,
        currentQuantity: item.currentQuantity,
        minQuantity: item.minQuantity,
        unit: item.unit
      }))
      .sort((a, b) => a.currentQuantity - b.currentQuantity) // Ordenar por quantidade (menor primeiro)

    // Buscar movimentações no período especificado
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        clinicId,
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      select: {
        id: true,
        type: true,
        quantity: true,
        createdAt: true,
        item: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcular estatísticas de movimentações
    const totalMovements = movements.length

    const movementsByType = {
      IN: movements.filter(movement => movement.type === 'IN').length,
      OUT: movements.filter(movement => movement.type === 'OUT').length
    }

    // Últimas 10 movimentações
    const recentMovements = movements.slice(0, 10).map(movement => ({
      id: movement.id,
      itemName: movement.item?.name || 'Item não encontrado',
      type: movement.type,
      quantity: movement.quantity,
      unit: movement.item?.unit || '',
      createdAt: movement.createdAt,
      createdByName: movement.createdBy?.name || 'Usuário não encontrado'
    }))

    // Retornar dados do relatório
    const reportData = {
      totalItems,
      activeItems,
      inactiveItems,
      lowStockItems,
      outOfStockItems,
      totalMovements,
      movementsByType,
      recentMovements,
      itemsLowStock
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error('Erro ao gerar relatório de estoque:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}