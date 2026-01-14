import { inventoryMovementRepository } from '../infra/inventory-movement.repository'
import { 
  listInventoryMovementsSchema, 
  ListInventoryMovementsInput, 
  InventoryMovementOutput 
} from '../domain/inventory-movement.schema'

export interface ListInventoryMovementsParams {
  clinicId: string
  filters?: ListInventoryMovementsInput
}

export interface ListInventoryMovementsResult {
  success: true
  data: InventoryMovementOutput[]
}

/**
 * Lista movimentações de estoque de uma clínica com filtros opcionais
 */
export async function listInventoryMovements(params: ListInventoryMovementsParams): Promise<ListInventoryMovementsResult> {
  const { clinicId, filters } = params

  // Validar filtros se fornecidos
  if (filters) {
    const validation = listInventoryMovementsSchema.safeParse(filters)
    if (!validation.success) {
      throw new Error(`Filtros inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
    }
  }

  // Buscar movimentações de estoque
  const inventoryMovements = await inventoryMovementRepository.findMany(clinicId, filters)

  return {
    success: true,
    data: inventoryMovements
  }
}