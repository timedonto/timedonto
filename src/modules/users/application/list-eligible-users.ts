import { userRepository } from '../infra/user.repository'
import { dentistRepository } from '@/modules/dentists/infra/dentist.repository'
import { UserRole } from '@/generated/client'
import { UserOutput } from '../domain/user.schema'

export interface ListEligibleUsersParams {
  clinicId: string
}

export interface ListEligibleUsersResult {
  success: true
  data: UserOutput[]
}

/**
 * Lista usuários elegíveis para se tornarem dentistas
 * 
 * Regras de elegibilidade:
 * - Usuário deve ter role DENTIST
 * - Usuário deve estar ativo (isActive = true)
 * - Usuário NÃO pode já estar vinculado a um dentista
 * - Usuário deve pertencer à clínica especificada
 */
export async function listEligibleUsers(params: ListEligibleUsersParams): Promise<ListEligibleUsersResult> {
  const { clinicId } = params

  // Buscar todos os usuários ativos com role DENTIST da clínica
  const allDentistUsers = await userRepository.findMany(clinicId, {
    role: UserRole.DENTIST,
    isActive: true
  })

  // Filtrar usuários que NÃO são dentistas ainda
  const eligibleUsers: UserOutput[] = []
  
  for (const user of allDentistUsers) {
    const isAlreadyDentist = await dentistRepository.userIsDentist(user.id, clinicId)
    
    if (!isAlreadyDentist) {
      eligibleUsers.push(user)
    }
  }

  return {
    success: true,
    data: eligibleUsers
  }
}