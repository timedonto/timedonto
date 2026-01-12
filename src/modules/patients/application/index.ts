// Use cases
export * from './list-patients'
export * from './create-patient'
export * from './update-patient'
export * from './get-patient'

// Re-export domain types
export type {
  CreatePatientInput,
  UpdatePatientInput,
  ListPatientsInput,
  PatientOutput,
  CreatePatientData,
  UpdatePatientData,
  ListPatientsFilters,
  GetPatientInput,
  DeletePatientInput,
  UpdatePatientWithIdInput,
  CreatePatientWithClinicInput,
  ListPatientsWithClinicInput
} from '../domain/patient.schema'

// Re-export schemas for validation
export {
  createPatientSchema,
  updatePatientSchema,
  listPatientsSchema,
  patientIdSchema,
  clinicIdSchema,
  getPatientSchema,
  deletePatientSchema,
  updatePatientWithIdSchema,
  createPatientWithClinicSchema,
  listPatientsWithClinicSchema
} from '../domain/patient.schema'