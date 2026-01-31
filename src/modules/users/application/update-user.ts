import { UserRole } from '@/generated/client'
import { userRepository } from '../infra/user.repository'
import { 
  updateUserSchema, 
  UpdateUserInput, 
  UserOutput 
} from '../domain/user.schema'

export interface UpdateUserParams {
  userId: string
  clinicId: string
  currentUserId: string
  currentUserRole: UserRole
  data: UpdateUserInput
}

export interface UpdateUserResult {
  success: boolean
  data?: UserOutput
  error?: string
}

/**
 * Atualiza um usuário com validações de permissão e regras de negócio
 */
export async function updateUser(params: UpdateUserParams): Promise<UpdateUserResult> {
  const { userId, clinicId, currentUserId, currentUserRole, data } = params

  try {
    // Validar dados de entrada
    const validation = updateUserSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Apenas OWNER e ADMIN podem editar usuários
    if (currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
      return {
        success: false,
        error: 'Apenas proprietários e administradores podem editar usuários'
      }
    }

    // Buscar usuário a ser editado
    const targetUser = await userRepository.findById(userId, clinicId)
    if (!targetUser) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      }
    }

    // Regra de negócio: ADMIN não pode editar OWNER
    if (currentUserRole === UserRole.ADMIN && targetUser.role === UserRole.OWNER) {
      return {
        success: false,
        error: 'Administradores não podem editar proprietários'
      }
    }

    // Regra de negócio: ADMIN não pode promover para OWNER
    if (currentUserRole === UserRole.ADMIN && validatedData.role === UserRole.OWNER) {
      return {
        success: false,
        error: 'Administradores não podem promover usuários a proprietários'
      }
    }

    // Regra de negócio: Usuário não pode desativar a própria conta
    if (currentUserId === userId && validatedData.isActive === false) {
      return {
        success: false,
        error: 'Você não pode desativar sua própria conta'
      }
    }

    // Regra de negócio: Usuário não pode alterar o próprio cargo
    if (currentUserId === userId && validatedData.role && validatedData.role !== targetUser.role) {
      return {
        success: false,
        error: 'Você não pode alterar seu próprio cargo'
      }
    }

    // Regra de negócio: Não pode desativar/rebaixar o único OWNER
    if (targetUser.role === UserRole.OWNER) {
      const isOnlyOwner = await userRepository.isOnlyOwner(userId, clinicId)
      
      if (isOnlyOwner) {
        // Não pode desativar o único owner
        if (validatedData.isActive === false) {
          return {
            success: false,
            error: 'Não é possível desativar o único proprietário da clínica'
          }
        }

        // Não pode rebaixar o único owner
        if (validatedData.role && validatedData.role !== UserRole.OWNER) {
          return {
            success: false,
            error: 'Não é possível alterar o cargo do único proprietário da clínica'
          }
        }
      }
    }

    // Regra de negócio: Email deve ser único (se alterado)
    if (validatedData.email && validatedData.email !== targetUser.email) {
      const emailExists = await userRepository.emailExists(validatedData.email, clinicId, userId)
      if (emailExists) {
        return {
          success: false,
          error: 'Este email já está em uso na clínica'
        }
      }
    }

    // Atualizar usuário
    const updatedUser = await userRepository.update(userId, clinicId, validatedData)

    if (!updatedUser) {
      return {
        success: false,
        error: 'Erro ao atualizar usuário'
      }
    }

    return {
      success: true,
      data: updatedUser
    }

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}