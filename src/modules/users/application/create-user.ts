import { UserRole } from '@prisma/client'
import { userRepository } from '../infra/user.repository'
import { 
  createUserSchema, 
  CreateUserInput, 
  UserOutput 
} from '../domain/user.schema'

export interface CreateUserParams {
  clinicId: string
  currentUserRole: UserRole
  data: CreateUserInput
}

export interface CreateUserResult {
  success: boolean
  data?: UserOutput
  error?: string
}

/**
 * Cria um novo usuário com validações de permissão e regras de negócio
 */
export async function createUser(params: CreateUserParams): Promise<CreateUserResult> {
  const { clinicId, currentUserRole, data } = params

  try {
    // Validar dados de entrada
    const validation = createUserSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Apenas OWNER e ADMIN podem criar usuários
    if (currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
      return {
        success: false,
        error: 'Apenas proprietários e administradores podem criar usuários'
      }
    }

    // Regra de negócio: ADMIN não pode criar OWNER
    if (currentUserRole === UserRole.ADMIN && validatedData.role === UserRole.OWNER) {
      return {
        success: false,
        error: 'Administradores não podem criar proprietários'
      }
    }

    // Regra de negócio: Email deve ser único na clínica
    const emailExists = await userRepository.emailExists(validatedData.email, clinicId)
    if (emailExists) {
      return {
        success: false,
        error: 'Este email já está em uso na clínica'
      }
    }

    // Criar usuário
    const newUser = await userRepository.create(clinicId, validatedData)

    return {
      success: true,
      data: newUser
    }

  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}