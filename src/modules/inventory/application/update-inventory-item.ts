import { inventoryItemRepository } from '../infra/inventory-item.repository'
import { 
  updateInventoryItemSchema, 
  UpdateInventoryItemInput, 
  InventoryItemOutput 
} from '../domain/inventory-item.schema'

export interface UpdateInventoryItemParams {
  id: string
  clinicId: string
  data: UpdateInventoryItemInput
}

export interface UpdateInventoryItemResult {
  success: boolean
  data?: InventoryItemOutput
  error?: string
}

/**
 * Atualiza um item de estoque com validações de regras de negócio
 */
export async function updateInventoryItem(params: UpdateInventoryItemParams): Promise<UpdateInventoryItemResult> {
  const { id, clinicId, data } = params

  try {
    // Validar dados de entrada
    const validation = updateInventoryItemSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Verificar se item existe e pertence à clínica
    const existingItem = await inventoryItemRepository.findById(id, clinicId)
    if (!existingItem) {
      return {
        success: false,
        error: 'Item de estoque não encontrado'
      }
    }

    // Regra de negócio: Nome deve ser único na clínica (se alterado)
    if (validatedData.name && validatedData.name !== existingItem.name) {
      const nameExists = await inventoryItemRepository.nameExists(validatedData.name, clinicId, id)
      if (nameExists) {
        return {
          success: false,
          error: 'Já existe um item com este nome na clínica'
        }
      }
    }

    // Atualizar item de estoque
    const updatedItem = await inventoryItemRepository.update(id, clinicId, validatedData)

    if (!updatedItem) {
      return {
        success: false,
        error: 'Erro ao atualizar item de estoque'
      }
    }

    return {
      success: true,
      data: updatedItem
    }

  } catch (error) {
    console.error('Erro ao atualizar item de estoque:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}