import { UserRole } from '@/generated/client'
import { dentistRepository } from '../infra/dentist.repository'
import { userRepository } from '@/modules/users/infra/user.repository'
import {
  createDentistSchema,
  CreateDentistInput,
  DentistOutput
} from '../domain/dentist.schema'

export interface CreateDentistParams {
  clinicId: string
  currentUserRole: UserRole
  data: CreateDentistInput
}

export interface CreateDentistResult {
  success: boolean
  data?: DentistOutput
  error?: string
}

/**
 * Cria um novo dentista com validações de permissão e regras de negócio
 */
export async function createDentist(params: CreateDentistParams): Promise<CreateDentistResult> {
  const { clinicId, currentUserRole, data } = params

  try {
    // Validar dados de entrada
    const validation = createDentistSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Apenas OWNER e ADMIN podem criar dentistas
    if (currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
      return {
        success: false,
        error: 'Apenas proprietários e administradores podem criar dentistas'
      }
    }

    // Regra de negócio: Verificar se userId existe e pertence à clínica
    const user = await userRepository.findById(validatedData.userId, clinicId)
    if (!user) {
      return {
        success: false,
        error: 'Usuário não encontrado ou não pertence a esta clínica'
      }
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return {
        success: false,
        error: 'Não é possível criar dentista para um usuário inativo'
      }
    }

    // Regra de negócio: Verificar se user já não é dentista
    const existingDentist = await dentistRepository.findByUserId(validatedData.userId, clinicId)
    if (existingDentist) {
      return {
        success: false,
        error: `O usuário "${user.name}" já está cadastrado como dentista na clínica. Cada usuário pode estar vinculado a apenas um dentista.`
      }
    }

    // Verificar se CRO já existe na clínica
    const croExists = await dentistRepository.croExists(validatedData.cro, clinicId)
    if (croExists) {
      return {
        success: false,
        error: 'Este CRO já está cadastrado na clínica'
      }
    }

    // Regra de negócio: Apenas usuários com role DENTIST podem ser dentistas
    if (user.role !== UserRole.DENTIST) {
      return {
        success: false,
        error: 'Apenas usuários com cargo DENTIST podem ser cadastrados como dentistas'
      }
    }

    // Criar dentista
    const newDentist = await dentistRepository.create(clinicId, validatedData)

    // Associar especialidades se fornecidas
    if (validatedData.specialtyIds && validatedData.specialtyIds.length > 0) {
      await dentistRepository.associateSpecialties(newDentist.id, validatedData.specialtyIds)
    }

    // Buscar dentista com especialidades associadas
    const dentistWithSpecialties = await dentistRepository.findById(newDentist.id, clinicId)

    return {
      success: true,
      data: dentistWithSpecialties || newDentist
    }

  } catch (error) {
    console.error('Erro ao criar dentista:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}