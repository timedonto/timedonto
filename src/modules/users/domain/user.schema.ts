import { z } from 'zod'
import { UserRole } from '@/generated/client'

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z
    .string()
    .email('Email deve ter um formato válido')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  role: z.nativeEnum(UserRole, {
    message: 'Cargo deve ser OWNER, ADMIN, DENTIST ou RECEPTIONIST'
  })
})

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Email deve ter um formato válido')
    .toLowerCase()
    .trim()
    .optional(),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .optional(),
  role: z.nativeEnum(UserRole, {
    message: 'Cargo deve ser OWNER, ADMIN, DENTIST ou RECEPTIONIST'
  }).optional(),
  isActive: z.boolean().optional()
})

export const listUsersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  search: z
    .string()
    .min(1, 'Busca deve ter pelo menos 1 caractere')
    .max(100, 'Busca deve ter no máximo 100 caracteres')
    .trim()
    .optional()
})

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ListUsersInput = z.infer<typeof listUsersSchema>

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface UserOutput {
  id: string
  clinicId: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const userIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
})

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
})

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getUserSchema = userIdSchema

export const deleteUserSchema = userIdSchema

export const updateUserWithIdSchema = userIdSchema.merge(
  z.object({
    data: updateUserSchema
  })
)

export const createUserWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createUserSchema
  })
)

export const listUsersWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listUsersSchema.optional()
  })
)

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetUserInput = z.infer<typeof getUserSchema>
export type DeleteUserInput = z.infer<typeof deleteUserSchema>
export type UpdateUserWithIdInput = z.infer<typeof updateUserWithIdSchema>
export type CreateUserWithClinicInput = z.infer<typeof createUserWithClinicSchema>
export type ListUsersWithClinicInput = z.infer<typeof listUsersWithClinicSchema>