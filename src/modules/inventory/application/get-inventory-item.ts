import { inventoryItemRepository } from '../infra/inventory-item.repository'
import { InventoryItemOutput } from '../domain/inventory-item.schema'

export interface GetInventoryItemParams {
  id: string
  clinicId: string
}

export interface GetInventoryItemResult {
  success: boolean
  data?: InventoryItemOutput | null
  error?: string
}

/**
 * Busca um item de estoque por ID validando que pertence à clínica
 */
export async function getInventoryItem(params: GetInventoryItemParams): Promise<GetInventoryItemResult> {
  const { id, clinicId } = params

  try {
    // Buscar item de estoque
    const inventoryItem = await inventoryItemRepository.findById(id, clinicId)

    return {
      success: true,
      data: inventoryItem
    }

  } catch (error) {
    console.error('Erro ao buscar item de estoque:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}