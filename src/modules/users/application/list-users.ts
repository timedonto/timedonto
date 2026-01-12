import { userRepository } from '../infra/user.repository'
import { 
  listUsersSchema, 
  ListUsersInput, 
  UserOutput 
} from '../domain/user.schema'

export interface ListUsersParams {
  clinicId: string
  filters?: ListUsersInput
}

export interface ListUsersResult {
  success: true
  data: UserOutput[]
}

/**
 * Lista usuários de uma clínica com filtros opcionais
 */
export async function listUsers(params: ListUsersParams): Promise<ListUsersResult> {
  const { clinicId, filters } = params

  // Validar filtros se fornecidos
  if (filters) {
    const validation = listUsersSchema.safeParse(filters)
    if (!validation.success) {
      throw new Error(`Filtros inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
    }
  }

  // Buscar usuários
  const users = await userRepository.findMany(clinicId, filters)

  return {
    success: true,
    data: users
  }
}