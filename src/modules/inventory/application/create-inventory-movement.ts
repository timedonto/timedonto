import { prisma } from '@/lib/database'
import { inventoryMovementRepository } from '../infra/inventory-movement.repository'
import { inventoryItemRepository } from '../infra/inventory-item.repository'
import { 
  createInventoryMovementSchema, 
  CreateInventoryMovementInput, 
  InventoryMovementOutput 
} from '../domain/inventory-movement.schema'

export interface CreateInventoryMovementParams {
  clinicId: string
  userId: string
  data: CreateInventoryMovementInput
}

export interface CreateInventoryMovementResult {
  success: boolean
  data?: InventoryMovementOutput
  error?: string
}

/**
 * Cria uma nova movimentação de estoque com validações de regras de negócio
 * e atualização automática da quantidade do item
 */
export async function createInventoryMovement(params: CreateInventoryMovementParams): Promise<CreateInventoryMovementResult> {
  const { clinicId, userId, data } = params

  try {
    // Validar dados de entrada
    const validation = createInventoryMovementSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Verificar se item existe e pertence à clínica
    const existingItem = await inventoryItemRepository.findById(validatedData.itemId, clinicId)
    if (!existingItem) {
      return {
        success: false,
        error: 'Item de estoque não encontrado'
      }
    }

    // Verificar se item está ativo
    if (!existingItem.isActive) {
      return {
        success: false,
        error: 'Item de estoque está inativo'
      }
    }

    // Para movimentações de saída, verificar se há quantidade suficiente
    if (validatedData.type === 'OUT') {
      if (existingItem.currentQuantity < validatedData.quantity) {
        return {
          success: false,
          error: `Quantidade insuficiente em estoque. Disponível: ${existingItem.currentQuantity} ${existingItem.unit}`
        }
      }
    }

    // Calcular nova quantidade do item
    const newQuantity = validatedData.type === 'IN' 
      ? existingItem.currentQuantity + validatedData.quantity
      : existingItem.currentQuantity - validatedData.quantity

    // Executar transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar quantidade do item
      await tx.inventoryItem.update({
        where: {
          id: validatedData.itemId,
          clinicId // Garantir multi-tenancy
        },
        data: {
          currentQuantity: newQuantity
        }
      })

      // Criar movimentação
      const movement = await tx.inventoryMovement.create({
        data: {
          clinicId,
          itemId: validatedData.itemId,
          type: validatedData.type,
          quantity: validatedData.quantity,
          appointmentId: validatedData.appointmentId || null,
          createdById: userId,
          notes: validatedData.notes || null,
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

      return movement
    })

    // Transformar dados para o formato esperado
    const inventoryMovement: InventoryMovementOutput = {
      id: result.id,
      clinicId: result.clinicId,
      itemId: result.itemId,
      type: result.type as 'IN' | 'OUT',
      quantity: result.quantity,
      appointmentId: result.appointmentId,
      createdById: result.createdById,
      notes: result.notes,
      createdAt: result.createdAt,
      // Relacionamentos opcionais
      item: result.item ? {
        id: result.item.id,
        name: result.item.name,
        unit: result.item.unit
      } : undefined,
      createdBy: result.createdBy ? {
        id: result.createdBy.id,
        name: result.createdBy.name
      } : undefined,
      appointment: result.appointment ? {
        id: result.appointment.id,
        date: result.appointment.date,
        procedure: result.appointment.procedure,
        patient: result.appointment.patient ? {
          id: result.appointment.patient.id,
          name: result.appointment.patient.name
        } : undefined
      } : undefined
    }

    return {
      success: true,
      data: inventoryMovement
    }

  } catch (error) {
    console.error('Erro ao criar movimentação de estoque:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}