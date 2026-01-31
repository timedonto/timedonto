import { UserRole } from '@/generated/client'
import { prisma } from '@/lib/database'
import { procedureRepository } from '../infra/procedure.repository'

export interface DeactivateProcedureParams {
    procedureId: string
    clinicId: string
    currentUserRole: UserRole
}

export interface DeactivateProcedureResult {
    success: boolean
    error?: string
}

/**
 * P0.4 - Use Case: Inativar Procedimento
 * 
 * Validações CRÍTICAS:
 * - Apenas OWNER/ADMIN podem inativar
 * - Procedimento NÃO pode estar em uso em agendamentos ativos
 * - Soft delete via isActive: false
 */
export async function deactivateProcedure(params: DeactivateProcedureParams): Promise<DeactivateProcedureResult> {
    const { procedureId, clinicId, currentUserRole } = params

    try {
        // 1. Validação de permissão
        if (currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
            return {
                success: false,
                error: 'Apenas proprietários e administradores podem inativar procedimentos'
            }
        }

        // 2. Verificar se procedimento existe e pertence à clínica
        const procedure = await procedureRepository.findById(procedureId, clinicId)
        if (!procedure) {
            return {
                success: false,
                error: 'Procedimento não encontrado'
            }
        }

        // 3. P0.4 - CRÍTICO: Verificar se procedimento está em uso
        const appointmentsCount = await prisma.appointment.count({
            where: {
                clinicId,
                procedureId,
                status: {
                    in: ['SCHEDULED', 'CONFIRMED'] // Apenas agendamentos ativos
                }
            }
        })

        if (appointmentsCount > 0) {
            return {
                success: false,
                error: `Não é possível inativar este procedimento. Existem ${appointmentsCount} agendamento(s) ativo(s) utilizando-o.`
            }
        }

        // 4. Inativar procedimento (soft delete)
        await procedureRepository.update(procedureId, clinicId, {
            id: procedureId,
            isActive: false
        })

        return { success: true }

    } catch (error) {
        console.error('[DeactivateProcedure] Error:', error)
        return {
            success: false,
            error: 'Ocorreu um erro ao inativar o procedimento'
        }
    }
}

/**
 * Use Case: Ativar Procedimento
 */
export async function activateProcedure(params: DeactivateProcedureParams): Promise<DeactivateProcedureResult> {
    const { procedureId, clinicId, currentUserRole } = params

    try {
        // 1. Validação de permissão
        if (currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
            return {
                success: false,
                error: 'Apenas proprietários e administradores podem ativar procedimentos'
            }
        }

        // 2. Verificar se procedimento existe
        const procedure = await procedureRepository.findById(procedureId, clinicId)
        if (!procedure) {
            return {
                success: false,
                error: 'Procedimento não encontrado'
            }
        }

        // 3. Ativar procedimento
        await procedureRepository.update(procedureId, clinicId, {
            id: procedureId,
            isActive: true
        })

        return { success: true }

    } catch (error) {
        console.error('[ActivateProcedure] Error:', error)
        return {
            success: false,
            error: 'Ocorreu um erro ao ativar o procedimento'
        }
    }
}
