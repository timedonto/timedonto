import { inventoryItemRepository } from '../infra/inventory-item.repository'
import { 
  createInventoryItemSchema, 
  CreateInventoryItemInput, 
  InventoryItemOutput 
} from '../domain/inventory-item.schema'

export interface CreateInventoryItemParams {
  clinicId: string
  data: CreateInventoryItemInput
}

export interface CreateInventoryItemResult {
  success: boolean
  data?: InventoryItemOutput
  error?: string
}

/**
 * Cria um novo item de estoque com validações de regras de negócio
 */
export async function createInventoryItem(params: CreateInventoryItemParams): Promise<CreateInventoryItemResult> {
  const { clinicId, data } = params

  try {
    // Validar dados de entrada
    const validation = createInventoryItemSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Nome deve ser único na clínica
    const nameExists = await inventoryItemRepository.nameExists(validatedData.name, clinicId)
    if (nameExists) {
      return {
        success: false,
        error: 'Já existe um item com este nome na clínica'
      }
    }

    // Criar item de estoque
    const newInventoryItem = await inventoryItemRepository.create(clinicId, validatedData)

    return {
      success: true,
      data: newInventoryItem
    }

  } catch (error) {
    console.error('Erro ao criar item de estoque:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}