import { auth } from '@/lib/auth'
import type { SessionUser } from '@/types'

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role,
    clinicId: session.user.clinicId,
    clinicName: session.user.clinicName,
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser()
  
  if (!user) {
    throw new Error('Usuário não autenticado')
  }

  return user
}