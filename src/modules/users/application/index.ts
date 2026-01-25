// Use cases
export * from './list-users'
export * from './list-eligible-users'
export * from './create-user'
export * from './update-user'

// Re-export domain types
export type {
  CreateUserInput,
  UpdateUserInput,
  ListUsersInput,
  UserOutput,
  GetUserInput,
  DeleteUserInput,
  UpdateUserWithIdInput,
  CreateUserWithClinicInput,
  ListUsersWithClinicInput
} from '../domain/user.schema'

// Re-export schemas for validation
export {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  userIdSchema,
  clinicIdSchema,
  getUserSchema,
  deleteUserSchema,
  updateUserWithIdSchema,
  createUserWithClinicSchema,
  listUsersWithClinicSchema
} from '../domain/user.schema'