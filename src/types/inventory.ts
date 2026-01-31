// src/types/inventory.ts
// Tipos para estoque - usar em app/ e components (substitui @prisma/client)

export const InventoryMovementType = {
  IN: 'IN',
  OUT: 'OUT',
} as const

export type InventoryMovementType = (typeof InventoryMovementType)[keyof typeof InventoryMovementType]
