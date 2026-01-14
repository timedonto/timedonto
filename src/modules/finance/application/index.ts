// Use cases
export * from './list-payments'
export * from './create-payment'
export * from './get-daily-summary'
export * from './get-monthly-summary'

// Re-export domain types
export type {
  CreatePaymentInput,
  ListPaymentsInput,
  PaymentOutput,
  PaymentMethod,
  CreatePaymentData,
  ListPaymentsFilters,
  GetPaymentInput,
  DeletePaymentInput,
  CreatePaymentWithClinicInput,
  ListPaymentsWithClinicInput
} from '../domain/payment.schema'

// Re-export schemas for validation
export {
  PaymentMethodEnum,
  createPaymentSchema,
  listPaymentsSchema,
  paymentIdSchema,
  clinicIdSchema,
  getPaymentSchema,
  deletePaymentSchema,
  createPaymentWithClinicSchema,
  listPaymentsWithClinicSchema,
  getPaymentMethodLabel,
  getPaymentMethodIcon,
  validateDateRange,
  formatPaymentAmount,
  PAYMENT_METHODS,
  MAX_PAYMENT_AMOUNT,
  MAX_DESCRIPTION_LENGTH
} from '../domain/payment.schema'

// Re-export repository types and instance
export type {
  PaymentSummary,
  DailySummary,
  MonthlySummary
} from '../infra/payment.repository'

export { paymentRepository } from '../infra/payment.repository'