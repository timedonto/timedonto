export const APP_NAME = 'TimeDonto'
export const APP_DESCRIPTION = 'Sistema de Gestão para Clínicas Odontológicas'

export const USER_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  DENTIST: 'DENTIST',
  RECEPTIONIST: 'RECEPTIONIST',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

// Rotas públicas (não precisam de autenticação)
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/api/auth',
]

// Rotas da área autenticada
export const APP_ROUTES = {
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  APPOINTMENTS: '/appointments',
  DENTISTS: '/dentists',
  TREATMENT_PLANS: '/treatment-plans',
  FINANCE: '/finance',
  INVENTORY: '/inventory',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const