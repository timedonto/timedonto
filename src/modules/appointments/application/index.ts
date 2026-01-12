// Use cases
export * from './list-appointments'
export * from './create-appointment'
export * from './update-appointment'
export * from './get-appointment'

// Re-export domain types
export type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  ListAppointmentsInput,
  AppointmentOutput,
  CreateAppointmentData,
  UpdateAppointmentData,
  ListAppointmentsFilters,
  GetAppointmentInput,
  DeleteAppointmentInput,
  UpdateAppointmentWithIdInput,
  CreateAppointmentWithClinicInput,
  ListAppointmentsWithClinicInput,
  ListAppointmentsByDentistInput,
  ListAppointmentsByPatientInput,
  AppointmentConflictInput,
  WorkingHoursValidationInput,
  CommonProcedure
} from '../domain/appointment.schema'

// Re-export schemas for validation
export {
  createAppointmentSchema,
  updateAppointmentSchema,
  listAppointmentsSchema,
  appointmentIdSchema,
  clinicIdSchema,
  dentistIdSchema,
  patientIdSchema,
  getAppointmentSchema,
  deleteAppointmentSchema,
  updateAppointmentWithIdSchema,
  createAppointmentWithClinicSchema,
  listAppointmentsWithClinicSchema,
  listAppointmentsByDentistSchema,
  listAppointmentsByPatientSchema,
  appointmentConflictSchema,
  workingHoursValidationSchema,
  APPOINTMENT_STATUS_LABELS,
  ACTIVE_APPOINTMENT_STATUSES,
  COMPLETED_APPOINTMENT_STATUSES,
  COMMON_PROCEDURES
} from '../domain/appointment.schema'

// Re-export repository for direct access if needed
export { appointmentRepository } from '../infra/appointment.repository'