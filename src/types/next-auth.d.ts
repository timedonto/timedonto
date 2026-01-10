import type { UserRole } from '@/config/constants'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: UserRole
      clinicId: string
      clinicName: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: UserRole
    clinicId: string
    clinicName: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    clinicId: string
    clinicName: string
  }
}