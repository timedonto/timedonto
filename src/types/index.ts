import type { UserRole } from '@/config/constants'

// Tipo do usuário na sessão
export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  clinicId: string
  clinicName: string
}

// Resposta padrão da API
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Dados para criar clínica (signup)
export interface CreateClinicData {
  clinicName: string
  ownerName: string
  email: string
  password: string
}