import { inventoryItemRepository } from '../infra/inventory-item.repository'
import { 
  listInventoryItemsSchema, 
  ListInventoryItemsInput, 
  InventoryItemOutput 
} from '../domain/inventory-item.schema'

export interface ListInventoryItemsParams {
  clinicId: string
  filters?: ListInventoryItemsInput
}

export interface ListInventoryItemsResult {
  success: true
  data: InventoryItemOutput[]
}

/**
 * Lista itens de estoque de uma clínica com filtros opcionais
 */
export async function listInventoryItems(params: ListInventoryItemsParams): Promise<ListInventoryItemsResult> {
  const { clinicId, filters } = params

  // Validar filtros se fornecidos
  if (filters) {
    const validation = listInventoryItemsSchema.safeParse(filters)
    if (!validation.success) {
      throw new Error(`Filtros inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
    }
  }

  // Buscar itens de estoque
  const inventoryItems = await inventoryItemRepository.findMany(clinicId, filters)

  return {
    success: true,
    data: inventoryItems
  }
}