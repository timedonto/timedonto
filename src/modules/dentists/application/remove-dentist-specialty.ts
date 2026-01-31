import { prisma } from '@/lib/database'
import { UserRole } from '@/generated/client'
import { RemoveDentistSpecialtyInput } from '../domain/dentist.schema'

// =====================================================================
// TYPES
// =====================================================================

export interface RemoveDentistSpecialtyParams {
  clinicId: string
  currentUserRole: UserRole
  data: RemoveDentistSpecialtyInput
}

export interface RemoveDentistSpecialtyResult {
  success: boolean
  error?: string
}

// =====================================================================
// USE CASE
// =====================================================================

/**
 * Remove uma associação entre dentista e especialidade
 * 
 * Regras:
 * - Apenas OWNER e ADMIN podem remover associações
 * - Dentista deve pertencer à mesma clínica
 * - Associação deve existir
 */
export async function removeDentistSpecialty(
  params: RemoveDentistSpecialtyParams
): Promise<RemoveDentistSpecialtyResult> {
  try {
    const { clinicId, currentUserRole, data } = params

    // 1. Validar permissões
    if (!([UserRole.OWNER, UserRole.ADMIN] as readonly UserRole[]).includes(currentUserRole)) {
      return {
        success: false,
        error: 'Apenas proprietários e administradores podem remover especialidades'
      }
    }

    // 2. Validar se dentista existe e pertence à clínica
    const dentist = await prisma.dentist.findFirst({
      where: {
        id: data.dentistId,
        clinicId
      }
    })

    if (!dentist) {
      return {
        success: false,
        error: 'Dentista não encontrado ou não pertence a esta clínica'
      }
    }

    // 3. Verificar se a associação existe
    const association = await prisma.dentistSpecialty.findFirst({
      where: {
        dentistId: data.dentistId,
        specialtyId: data.specialtyId
      }
    })

    if (!association) {
      return {
        success: false,
        error: 'Associação entre dentista e especialidade não encontrada'
      }
    }

    // 4. Remover a associação
    await prisma.dentistSpecialty.delete({
      where: {
        id: association.id
      }
    })

    return {
      success: true
    }

  } catch (error) {
    console.error('Erro ao remover especialidade do dentista:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}