import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/database'
import { procedureRepository } from '../infra/procedure.repository'
import {
    updateProcedureSchema,
    UpdateProcedureData
} from '../domain/procedure.schema'

export interface UpdateProcedureParams {
    procedureId: string
    clinicId: string
    currentUserRole: UserRole
    data: UpdateProcedureData
}

export interface UpdateProcedureResult {
    success: boolean
    error?: string
}

/**
 * P0.3 - Use Case: Atualizar Procedimento
 * 
 * Validações:
 * - Apenas OWNER/ADMIN podem atualizar
 * - Procedimento deve pertencer à clínica
 * - Se alterar specialty, validar que pertence à clínica
 */
export async function updateProcedure(params: UpdateProcedureParams): Promise<UpdateProcedureResult> {
    const { procedureId, clinicId, currentUserRole, data } = params

    try {
        // 1. Validação de permissão
        if (currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
            return {
                success: false,
                error: 'Apenas proprietários e administradores podem atualizar procedimentos'
            }
        }

        // 2. Validação de dados
        const validation = updateProcedureSchema.safeParse({ ...data, id: procedureId })
        if (!validation.success) {
            return {
                success: false,
                error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
            }
        }

        // 3. Verificar se procedimento existe e pertence à clínica
        const existingProcedure = await procedureRepository.findById(procedureId, clinicId)
        if (!existingProcedure) {
            return {
                success: false,
                error: 'Procedimento não encontrado'
            }
        }

        // 4. Se alterar specialtyId, validar que existe (global)
        if (data.specialtyId && data.specialtyId !== existingProcedure.specialtyId) {
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
        }

        // 5. Atualizar procedimento
        await procedureRepository.update(procedureId, clinicId, validation.data)

        return { success: true }

    } catch (error) {
        console.error('[UpdateProcedure] Error:', error)
        return {
            success: false,
            error: 'Ocorreu um erro ao atualizar o procedimento'
        }
    }
}
