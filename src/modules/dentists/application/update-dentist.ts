import { UserRole } from '@/generated/client'
import { dentistRepository } from '../infra/dentist.repository'
import { 
  updateDentistSchema, 
  UpdateDentistInput, 
  DentistOutput 
} from '../domain/dentist.schema'

export interface UpdateDentistParams {
  dentistId: string
  clinicId: string
  currentUserRole: UserRole
  data: UpdateDentistInput
}

export interface UpdateDentistResult {
  success: boolean
  data?: DentistOutput
  error?: string
}

/**
 * Atualiza um dentista com validações de permissão e regras de negócio
 */
export async function updateDentist(params: UpdateDentistParams): Promise<UpdateDentistResult> {
  const { dentistId, clinicId, currentUserRole, data } = params

  try {
    // Validar dados de entrada
    const validation = updateDentistSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Apenas OWNER e ADMIN podem editar dentistas
    if (currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
      return {
        success: false,
        error: 'Apenas proprietários e administradores podem editar dentistas'
      }
    }

    // Regra de negócio: Verificar se dentista existe na clínica
    const existingDentist = await dentistRepository.findById(dentistId, clinicId)
    if (!existingDentist) {
      return {
        success: false,
        error: 'Dentista não encontrado'
      }
    }

    // Regra de negócio: Verificar se CRO já existe (se alterado)
    if (validatedData.cro && validatedData.cro !== existingDentist.cro) {
      const croExists = await dentistRepository.croExists(validatedData.cro, clinicId, dentistId)
      if (croExists) {
        return {
          success: false,
          error: 'Este CRO já está cadastrado na clínica'
        }
      }
    }

    // Atualizar dentista
    const updatedDentist = await dentistRepository.update(dentistId, clinicId, validatedData)

    if (!updatedDentist) {
      return {
        success: false,
        error: 'Erro ao atualizar dentista'
      }
    }

    return {
      success: true,
      data: updatedDentist
    }

  } catch (error) {
    console.error('Erro ao atualizar dentista:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}