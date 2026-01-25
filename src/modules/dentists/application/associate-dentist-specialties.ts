import { prisma } from '@/lib/database'
import { UserRole } from '@prisma/client'
import { AssociateDentistSpecialtiesInput } from '../domain/dentist.schema'

// =====================================================================
// TYPES
// =====================================================================

export interface AssociateDentistSpecialtiesParams {
  clinicId: string
  currentUserRole: UserRole
  data: AssociateDentistSpecialtiesInput
}

export interface AssociateDentistSpecialtiesResult {
  success: boolean
  error?: string
}

// =====================================================================
// USE CASE
// =====================================================================

/**
 * Associa especialidades a um dentista (Many-to-Many)
 * 
 * Regras:
 * - Apenas OWNER e ADMIN podem associar especialidades
 * - Dentista deve pertencer à mesma clínica
 * - Especialidades devem existir na tabela global
 * - Remove associações existentes e cria novas (replace)
 */
export async function associateDentistSpecialties(
  params: AssociateDentistSpecialtiesParams
): Promise<AssociateDentistSpecialtiesResult> {
  try {
    const { clinicId, currentUserRole, data } = params

    // 1. Validar permissões
    if (![UserRole.OWNER, UserRole.ADMIN].includes(currentUserRole)) {
      return {
        success: false,
        error: 'Apenas proprietários e administradores podem associar especialidades'
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

    // 3. Validar se todas as especialidades existem
    const specialties = await prisma.specialty.findMany({
      where: {
        id: {
          in: data.specialtyIds
        }
      }
    })

    if (specialties.length !== data.specialtyIds.length) {
      return {
        success: false,
        error: 'Uma ou mais especialidades não foram encontradas'
      }
    }

    // 4. Usar transação para substituir associações
    await prisma.$transaction(async (tx) => {
      // Remover associações existentes
      await tx.dentistSpecialty.deleteMany({
        where: {
          dentistId: data.dentistId
        }
      })

      // Criar novas associações
      const associationsData = data.specialtyIds.map(specialtyId => ({
        dentistId: data.dentistId,
        specialtyId
      }))

      await tx.dentistSpecialty.createMany({
        data: associationsData
      })
    })

    return {
      success: true
    }

  } catch (error) {
    console.error('Erro ao associar especialidades ao dentista:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}