import { prisma } from '@/lib/database'
import {
  CreateInventoryMovementInput,
  ListInventoryMovementsInput,
  InventoryMovementOutput,
  InventoryMovementType
} from '../domain/inventory-movement.schema'

export class InventoryMovementRepository {
  /**
   * Lista movimentações de estoque de uma clínica com filtros opcionais
   */
  async findMany(clinicId: string, filters?: ListInventoryMovementsInput): Promise<InventoryMovementOutput[]> {
    const where: any = {
      clinicId,
    }

    // Aplicar filtros
    if (filters?.itemId) {
      where.itemId = filters.itemId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.from || filters?.to) {
      where.createdAt = {}
      
      if (filters.from) {
        where.createdAt.gte = new Date(filters.from)
      }
      
      if (filters.to) {
        where.createdAt.lte = new Date(filters.to)
      }
    }

    const inventoryMovements = await prisma.inventoryMovement.findMany({
      where,
      select: {
        id: true,
        clinicId: true,
        itemId: true,
        type: true,
        quantity: true,
        appointmentId: true,
        createdById: true,
        notes: true,
        createdAt: true,
        // Relacionamentos
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
        },
        appointment: {
          select: {
            id: true,
            date: true,
            procedure: true,
            patient: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformar dados para o formato esperado
    return inventoryMovements.map(movement => ({
      id: movement.id,
      clinicId: movement.clinicId,
      itemId: movement.itemId,
      type: movement.type as InventoryMovementType,
      quantity: movement.quantity,
      appointmentId: movement.appointmentId,
      createdById: movement.createdById,
      notes: movement.notes,
      createdAt: movement.createdAt,
      // Relacionamentos opcionais
      item: movement.item ? {
        id: movement.item.id,
        name: movement.item.name,
        unit: movement.item.unit
      } : undefined,
      createdBy: movement.createdBy ? {
        id: movement.createdBy.id,
        name: movement.createdBy.name
      } : undefined,
      appointment: movement.appointment ? {
        id: movement.appointment.id,
        date: movement.appointment.date,
        procedure: movement.appointment.procedure,
        patient: movement.appointment.patient ? {
          id: movement.appointment.patient.id,
          name: movement.appointment.patient.name
        } : undefined
      } : undefined
    }))
  }

  /**
   * Cria uma nova movimentação de estoque
   */
  async create(clinicId: string, data: CreateInventoryMovementInput, createdById: string): Promise<InventoryMovementOutput> {
    const inventoryMovement = await prisma.inventoryMovement.create({
      data: {
        clinicId,
        itemId: data.itemId,
        type: data.type,
        quantity: data.quantity,
        appointmentId: data.appointmentId || null,
        createdById,
        notes: data.notes || null,
      },
      select: {
        id: true,
        clinicId: true,
        itemId: true,
        type: true,
        quantity: true,
        appointmentId: true,
        createdById: true,
        notes: true,
        createdAt: true,
        // Relacionamentos
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
        },
        appointment: {
          select: {
            id: true,
            date: true,
            procedure: true,
            patient: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Transformar dados para o formato esperado
    return {
      id: inventoryMovement.id,
      clinicId: inventoryMovement.clinicId,
      itemId: inventoryMovement.itemId,
      type: inventoryMovement.type as InventoryMovementType,
      quantity: inventoryMovement.quantity,
      appointmentId: inventoryMovement.appointmentId,
      createdById: inventoryMovement.createdById,
      notes: inventoryMovement.notes,
      createdAt: inventoryMovement.createdAt,
      // Relacionamentos opcionais
      item: inventoryMovement.item ? {
        id: inventoryMovement.item.id,
        name: inventoryMovement.item.name,
        unit: inventoryMovement.item.unit
      } : undefined,
      createdBy: inventoryMovement.createdBy ? {
        id: inventoryMovement.createdBy.id,
        name: inventoryMovement.createdBy.name
      } : undefined,
      appointment: inventoryMovement.appointment ? {
        id: inventoryMovement.appointment.id,
        date: inventoryMovement.appointment.date,
        procedure: inventoryMovement.appointment.procedure
      } : undefined
    }
  }

  /**
   * Lista movimentações de um item específico
   */
  async findByItemId(itemId: string, clinicId: string, filters?: ListInventoryMovementsInput): Promise<InventoryMovementOutput[]> {
    const combinedFilters = {
      ...filters,
      itemId
    }

    return this.findMany(clinicId, combinedFilters)
  }

  /**
   * Lista movimentações de um agendamento específico
   */
  async findByAppointmentId(appointmentId: string, clinicId: string): Promise<InventoryMovementOutput[]> {
    const where = {
      clinicId,
      appointmentId
    }

    const inventoryMovements = await prisma.inventoryMovement.findMany({
      where,
      select: {
        id: true,
        clinicId: true,
        itemId: true,
        type: true,
        quantity: true,
        appointmentId: true,
        createdById: true,
        notes: true,
        createdAt: true,
        // Relacionamentos
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

    // Transformar dados para o formato esperado
    return inventoryMovements.map(movement => ({
      id: movement.id,
      clinicId: movement.clinicId,
      itemId: movement.itemId,
      type: movement.type as InventoryMovementType,
      quantity: movement.quantity,
      appointmentId: movement.appointmentId,
      createdById: movement.createdById,
      notes: movement.notes,
      createdAt: movement.createdAt,
      // Relacionamentos opcionais
      item: movement.item ? {
        id: movement.item.id,
        name: movement.item.name,
        unit: movement.item.unit
      } : undefined,
      createdBy: movement.createdBy ? {
        id: movement.createdBy.id,
        name: movement.createdBy.name
      } : undefined
    }))
  }

  /**
   * Conta movimentações por tipo em um período
   */
  async countByType(clinicId: string, type: InventoryMovementType, from?: Date, to?: Date): Promise<number> {
    const where: any = {
      clinicId,
      type
    }

    if (from || to) {
      where.createdAt = {}
      
      if (from) {
        where.createdAt.gte = from
      }
      
      if (to) {
        where.createdAt.lte = to
      }
    }

    const count = await prisma.inventoryMovement.count({
      where
    })

    return count
  }

  /**
   * Soma quantidades por tipo em um período
   */
  async sumQuantityByType(clinicId: string, type: InventoryMovementType, from?: Date, to?: Date): Promise<number> {
    const where: any = {
      clinicId,
      type
    }

    if (from || to) {
      where.createdAt = {}
      
      if (from) {
        where.createdAt.gte = from
      }
      
      if (to) {
        where.createdAt.lte = to
      }
    }

    const result = await prisma.inventoryMovement.aggregate({
      where,
      _sum: {
        quantity: true
      }
    })

    return result._sum.quantity || 0
  }

  /**
   * Lista itens mais movimentados em um período
   */
  async getMostMovedItems(clinicId: string, limit: number = 10, from?: Date, to?: Date): Promise<Array<{
    itemId: string
    itemName: string
    totalMovements: number
    totalQuantity: number
  }>> {
    const where: any = {
      clinicId
    }

    if (from || to) {
      where.createdAt = {}
      
      if (from) {
        where.createdAt.gte = from
      }
      
      if (to) {
        where.createdAt.lte = to
      }
    }

    const movements = await prisma.inventoryMovement.groupBy({
      by: ['itemId'],
      where,
      _count: {
        id: true
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    })

    // Buscar nomes dos itens
    const itemIds = movements.map(m => m.itemId)
    const items = await prisma.inventoryItem.findMany({
      where: {
        id: {
          in: itemIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    const itemsMap = new Map(items.map(item => [item.id, item.name]))

    return movements.map(movement => ({
      itemId: movement.itemId,
      itemName: itemsMap.get(movement.itemId) || 'Item não encontrado',
      totalMovements: movement._count.id,
      totalQuantity: movement._sum.quantity || 0
    }))
  }
}

// Exportar instância singleton
export const inventoryMovementRepository = new InventoryMovementRepository()