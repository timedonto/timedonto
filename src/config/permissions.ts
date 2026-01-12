import { type UserRole } from '@prisma/client'

export type Permission =
  | 'clinic:manage'
  | 'users:manage'
  | 'dentists:manage'
  | 'patients:view'
  | 'patients:manage'
  | 'appointments:view'
  | 'appointments:manage'
  | 'records:view'
  | 'records:manage'
  | 'treatment-plans:view'
  | 'treatment-plans:manage'
  | 'treatment-plans:approve'
  | 'finance:view'
  | 'finance:manage'
  | 'inventory:view'
  | 'inventory:manage'
  | 'billing:manage'
  | 'reports:view'

const rolePermissions: Record<UserRole, Permission[]> = {
  OWNER: [
    'clinic:manage',
    'users:manage',
    'dentists:manage',
    'patients:view',
    'patients:manage',
    'appointments:view',
    'appointments:manage',
    'records:view',
    'records:manage',
    'treatment-plans:view',
    'treatment-plans:manage',
    'treatment-plans:approve',
    'finance:view',
    'finance:manage',
    'inventory:view',
    'inventory:manage',
    'billing:manage',
    'reports:view',
  ],
  ADMIN: [
    'users:manage',
    'dentists:manage',
    'patients:view',
    'patients:manage',
    'appointments:view',
    'appointments:manage',
    'records:view',
    'records:manage',
    'treatment-plans:view',
    'treatment-plans:manage',
    'treatment-plans:approve',
    'finance:view',
    'finance:manage',
    'inventory:view',
    'inventory:manage',
    'reports:view',
  ],
  DENTIST: [
    'patients:view',
    'appointments:view',
    'records:view',
    'records:manage',
    'treatment-plans:view',
    'treatment-plans:manage',
    'treatment-plans:approve',
    'inventory:view',
  ],
  RECEPTIONIST: [
    'patients:view',
    'patients:manage',
    'appointments:view',
    'appointments:manage',
    'treatment-plans:view',
    'inventory:view',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? []
}