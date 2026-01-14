// Use cases - Inventory Items
export * from './list-inventory-items'
export * from './create-inventory-item'
export * from './update-inventory-item'
export * from './get-inventory-item'

// Use cases - Inventory Movements
export * from './list-inventory-movements'
export * from './create-inventory-movement'

// Re-export domain types - Inventory Items
export type {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  ListInventoryItemsInput,
  InventoryItemOutput,
  CreateInventoryItemData,
  UpdateInventoryItemData,
  ListInventoryItemsFilters,
  GetInventoryItemInput,
  DeleteInventoryItemInput,
  UpdateInventoryItemWithIdInput,
  CreateInventoryItemWithClinicInput,
  ListInventoryItemsWithClinicInput
} from '../domain/inventory-item.schema'

// Re-export domain types - Inventory Movements
export type {
  CreateInventoryMovementInput,
  ListInventoryMovementsInput,
  InventoryMovementOutput,
  InventoryMovementType,
  CreateInventoryMovementData,
  ListInventoryMovementsFilters,
  GetInventoryMovementInput,
  CreateInventoryMovementWithClinicInput,
  ListInventoryMovementsWithClinicInput,
  ListMovementsByItemInput,
  CreateInMovementInput,
  CreateOutMovementInput,
  CreateAppointmentMovementInput
} from '../domain/inventory-movement.schema'

// Re-export schemas for validation - Inventory Items
export {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  listInventoryItemsSchema,
  inventoryItemIdSchema,
  getInventoryItemSchema,
  deleteInventoryItemSchema,
  updateInventoryItemWithIdSchema,
  createInventoryItemWithClinicSchema,
  listInventoryItemsWithClinicSchema
} from '../domain/inventory-item.schema'

// Re-export schemas for validation - Inventory Movements
export {
  createInventoryMovementSchema,
  listInventoryMovementsSchema,
  InventoryMovementTypeEnum,
  inventoryMovementIdSchema,
  getInventoryMovementSchema,
  createInventoryMovementWithClinicSchema,
  listInventoryMovementsWithClinicSchema,
  listMovementsByItemSchema,
  createInMovementSchema,
  createOutMovementSchema,
  createAppointmentMovementSchema
} from '../domain/inventory-movement.schema'