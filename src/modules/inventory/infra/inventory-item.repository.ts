import { prisma } from '@/lib/database'
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  ListInventoryItemsInput,
  InventoryItemOutput
} from '../domain/inventory-item.schema'

export class InventoryItemRepository {
  /**
   * Lista itens de estoque de uma clínica com filtros opcionais
   */
  async findMany(clinicId: string, filters?: ListInventoryItemsInput): Promise<InventoryItemOutput[]> {
    const where: any = {
      clinicId,
    }

    // Aplicar filtros
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
      select: {
        id: true,
        clinicId: true,
        name: true,
        description: true,
        unit: true,
        currentQuantity: true,
        minQuantity: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return inventoryItems
  }

  /**
   * Busca item de estoque por ID validando que pertence à clínica
   */
  async findById(id: string, clinicId: string): Promise<InventoryItemOutput | null> {
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        clinicId
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        description: true,
        unit: true,
        currentQuantity: true,
        minQuantity: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return inventoryItem
  }

  /**
   * Cria um novo item de estoque
   */
  async create(clinicId: string, data: CreateInventoryItemInput): Promise<InventoryItemOutput> {
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        clinicId,
        name: data.name,
        description: data.description || null,
        unit: data.unit,
        currentQuantity: data.currentQuantity ?? 0,
        minQuantity: data.minQuantity || null,
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        description: true,
        unit: true,
        currentQuantity: true,
        minQuantity: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return inventoryItem
  }

  /**
   * Atualiza um item de estoque existente
   */
  async update(id: string, clinicId: string, data: UpdateInventoryItemInput): Promise<InventoryItemOutput | null> {
    const updateData: any = {}

    if (data.name !== undefined) {
      updateData.name = data.name
    }

    if (data.description !== undefined) {
      updateData.description = data.description || null
    }

    if (data.unit !== undefined) {
      updateData.unit = data.unit
    }

    if (data.currentQuantity !== undefined) {
      updateData.currentQuantity = data.currentQuantity
    }

    if (data.minQuantity !== undefined) {
      updateData.minQuantity = data.minQuantity || null
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    const inventoryItem = await prisma.inventoryItem.update({
      where: {
        id,
        clinicId
      },
      data: updateData,
      select: {
        id: true,
        clinicId: true,
        name: true,
        description: true,
        unit: true,
        currentQuantity: true,
        minQuantity: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return inventoryItem
  }

  /**
   * Atualiza apenas a quantidade atual de um item de estoque
   */
  async updateQuantity(id: string, clinicId: string, quantity: number): Promise<InventoryItemOutput | null> {
    const inventoryItem = await prisma.inventoryItem.update({
      where: {
        id,
        clinicId
      },
      data: {
        currentQuantity: quantity
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        description: true,
        unit: true,
        currentQuantity: true,
        minQuantity: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return inventoryItem
  }

  /**
   * Verifica se nome já existe na clínica (para validação de unicidade)
   */
  async nameExists(name: string, clinicId: string, excludeItemId?: string): Promise<boolean> {
    const where: any = {
      name: {
        equals: name,
        mode: 'insensitive'
      },
      clinicId
    }

    if (excludeItemId) {
      where.id = {
        not: excludeItemId
      }
    }

    const inventoryItem = await prisma.inventoryItem.findFirst({
      where,
      select: { id: true }
    })

    return !!inventoryItem
  }

  /**
   * Deleta um item de estoque (soft delete - marca como inativo)
   */
  async delete(id: string, clinicId: string): Promise<InventoryItemOutput | null> {
    const inventoryItem = await prisma.inventoryItem.update({
      where: {
        id,
        clinicId
      },
      data: {
        isActive: false
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        description: true,
        unit: true,
        currentQuantity: true,
        minQuantity: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return inventoryItem
  }

  /**
   * Lista todos os itens de estoque ativos de uma clínica (para seletores)
   */
  async findActiveItems(clinicId: string): Promise<Pick<InventoryItemOutput, 'id' | 'name' | 'unit' | 'currentQuantity'>[]> {
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        clinicId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        unit: true,
        currentQuantity: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return inventoryItems
  }

  /**
   * Lista itens com estoque baixo (quantidade atual <= quantidade mínima)
   */
  async findLowStockItems(clinicId: string): Promise<InventoryItemOutput[]> {
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        clinicId,
        isActive: true,
        minQuantity: {
          not: null
        },
        currentQuantity: {
          lte: prisma.inventoryItem.fields.minQuantity
        }
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        description: true,
        unit: true,
        currentQuantity: true,
        minQuantity: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        {
          currentQuantity: 'asc'
        },
        {
          name: 'asc'
        }
      ]
    })

    return inventoryItems
  }

  /**
   * Conta itens de estoque ativos em uma clínica
   */
  async countActiveItems(clinicId: string): Promise<number> {
    const count = await prisma.inventoryItem.count({
      where: {
        clinicId,
        isActive: true
      }
    })

    return count
  }

  /**
   * Conta itens com estoque baixo em uma clínica
   */
  async countLowStockItems(clinicId: string): Promise<number> {
    const count = await prisma.inventoryItem.count({
      where: {
        clinicId,
        isActive: true,
        minQuantity: {
          not: null
        },
        currentQuantity: {
          lte: prisma.inventoryItem.fields.minQuantity
        }
      }
    })

    return count
  }
}

// Exportar instância singleton
export const inventoryItemRepository = new InventoryItemRepository()