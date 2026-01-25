// Use cases
export * from './list-dentists'
export * from './create-dentist'
export * from './update-dentist'
export * from './update-dentist-profile'
export * from './associate-dentist-specialties'
export * from './remove-dentist-specialty'

// Re-export domain types
export type {
  CreateDentistInput,
  UpdateDentistInput,
  UpdateDentistProfileInput,
  ListDentistsInput,
  DentistOutput,
  DentistSpecialtyOutput,
  GetDentistInput,
  DeleteDentistInput,
  UpdateDentistWithIdInput,
  CreateDentistWithClinicInput,
  ListDentistsWithClinicInput,
  GetDentistByUserInput,
  StructuredWorkingHours,
  StructuredBankInfo,
  CommonSpecialty,
  AssociateDentistSpecialtiesInput,
  RemoveDentistSpecialtyInput
} from '../domain/dentist.schema'

// Re-export schemas for validation
export {
  createDentistSchema,
  updateDentistSchema,
  updateDentistProfileSchema,
  listDentistsSchema,
  dentistIdSchema,
  clinicIdSchema,
  userIdSchema,
  getDentistSchema,
  deleteDentistSchema,
  updateDentistWithIdSchema,
  createDentistWithClinicSchema,
  listDentistsWithClinicSchema,
  getDentistByUserSchema,
  structuredWorkingHoursSchema,
  structuredBankInfoSchema,
  COMMON_SPECIALTIES,
  associateDentistSpecialtiesSchema,
  removeDentistSpecialtySchema
} from '../domain/dentist.schema'