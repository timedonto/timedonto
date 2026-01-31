// src/types/roles.ts
// Tipos para papéis de usuário - usar em componentes client ("use client")
// Substitui import de @prisma/client em frontend

export const UserRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  DENTIST: 'DENTIST',
  RECEPTIONIST: 'RECEPTIONIST',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]
