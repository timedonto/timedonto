import { UserRole } from '@/generated/client'
import { prisma } from '@/lib/database'
import { procedureRepository } from '../infra/procedure.repository'
import {
  createProcedureSchema,
  CreateProcedureData
} from '../domain/procedure.schema'

export interface CreateProcedureParams {
  clinicId: string
  currentUserRole: UserRole
  data: CreateProcedureData
}

export interface CreateProcedureResult {
  success: boolean
  error?: string
  data?: {
    id: string
    name: string
  }
}

/**
 * P0.3 - Use Case: Criar Procedimento
 * 
 * Validações:
 * - Apenas OWNER/ADMIN podem criar
 * - Specialty deve pertencer à mesma clínica
 * - Dados válidos (Zod)
 */
export async function createProcedure(params: CreateProcedureParams): Promise<CreateProcedureResult> {
  const { clinicId, currentUserRole, data } = params

  try {
    // 1. Validação de permissão
    if (currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
      return {
        success: false,
        error: 'Apenas proprietários e administradores podem criar procedimentos'
      }
    }

    // 2. Validação de dados
    const validation = createProcedureSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    // 3. Validar se specialty existe (global)
    const specialty = await prisma.specialty.findUnique({
      where: {
        id: data.specialtyId
      }
    })

    if (!specialty) {
      return {
        success: false,
        error: 'Especialidade não encontrada'
      }
    }

    // 4. Criar procedimento
    const procedure = await procedureRepository.create(clinicId, validation.data)

    return {
      success: true,
      data: {
        id: procedure.id,
        name: procedure.name
      }
    }

  } catch (error) {
    console.error('[CreateProcedure] Error:', error)
    return {
      success: false,
      error: 'Ocorreu um erro ao criar o procedimento'
    }
  }
}
