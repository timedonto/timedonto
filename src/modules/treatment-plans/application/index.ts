// Use cases
export * from './list-treatment-plans'
export * from './create-treatment-plan'
export * from './update-treatment-plan'
export * from './get-treatment-plan'

// Re-export domain types
export type {
  CreateTreatmentPlanInput,
  UpdateTreatmentPlanInput,
  ListTreatmentPlansInput,
  TreatmentPlanOutput,
  TreatmentItemInput,
  TreatmentItemOutput,
  TreatmentPlanStatus,
  CreateTreatmentPlanData,
  UpdateTreatmentPlanData,
  ListTreatmentPlansFilters,
  TreatmentItemData,
  GetTreatmentPlanInput,
  DeleteTreatmentPlanInput,
  UpdateTreatmentPlanWithIdInput,
  CreateTreatmentPlanWithClinicInput,
  ListTreatmentPlansWithClinicInput,
  TreatmentPlanWithCalculatedTotal
} from '../domain/treatment-plan.schema'

// Re-export schemas for validation
export {
  TreatmentPlanStatusEnum,
  treatmentItemSchema,
  createTreatmentPlanSchema,
  updateTreatmentPlanSchema,
  listTreatmentPlansSchema,
  treatmentPlanIdSchema,
  clinicIdSchema,
  getTreatmentPlanSchema,
  deleteTreatmentPlanSchema,
  updateTreatmentPlanWithIdSchema,
  createTreatmentPlanWithClinicSchema,
  listTreatmentPlansWithClinicSchema,
  calculateTotalAmount,
  treatmentPlanWithCalculatedTotalSchema
} from '../domain/treatment-plan.schema'

// Re-export repository for advanced use cases
export { treatmentPlanRepository } from '../infra/treatment-plan.repository'