import { UserRole } from '@/generated/client'
import { prisma } from '@/lib/database'
import {
    updateDentistProceduresSchema,
    UpdateDentistProceduresInput
} from '../domain/dentist-procedure.schema'

export interface UpdateDentistProceduresParams {
    dentistId: string
    clinicId: string
    currentUserRole: UserRole
    data: UpdateDentistProceduresInput
}

export interface UpdateDentistProceduresResult {
    success: boolean
    error?: string
}

/**
 * Service for OWNER or ADMIN to manage procedures linked to a dentist
 * 
 * P0.5 - Validações adicionadas:
 * - Procedimentos devem pertencer à mesma clínica
 * - Procedimentos devem estar ativos (isActive = true)
 */
export async function updateDentistProcedures(params: UpdateDentistProceduresParams): Promise<UpdateDentistProceduresResult> {
    const { dentistId, clinicId, currentUserRole, data } = params

    try {
        // 1. Validation
        const validation = updateDentistProceduresSchema.safeParse(data)
        if (!validation.success) {
            return {
                success: false,
                error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
            }
        }

        // 2. Authorization (OWNER/ADMIN only)
        if (currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
            return {
                success: false,
                error: 'Apenas proprietários e administradores podem gerenciar procedimentos de dentistas'
            }
        }

        // 3. Verify dentist belongs to clinic
        const dentist = await prisma.dentist.findFirst({
            where: { id: dentistId, clinicId }
        })

        if (!dentist) {
            return {
                success: false,
                error: 'Dentista não encontrado'
            }
        }

        // 4. P0.5 - CRÍTICO: Validar procedimentos
        if (data.procedureIds.length > 0) {
            const procedures = await prisma.procedure.findMany({
                where: {
                    id: { in: data.procedureIds },
                    clinicId
                },
                select: {
                    id: true,
                    name: true,
                    isActive: true,
                    clinicId: true
                }
            })

            // Verificar se todos os procedimentos foram encontrados
            if (procedures.length !== data.procedureIds.length) {
                const foundIds = procedures.map(p => p.id)
                const missingIds = data.procedureIds.filter(id => !foundIds.includes(id))
                return {
                    success: false,
                    error: `Procedimento(s) não encontrado(s) ou não pertence(m) a esta clínica: ${missingIds.join(', ')}`
                }
            }

            // Verificar se todos estão ativos
            const inactiveProcedures = procedures.filter(p => !p.isActive)
            if (inactiveProcedures.length > 0) {
                return {
                    success: false,
                    error: `Não é possível vincular procedimento(s) inativo(s): ${inactiveProcedures.map(p => p.name).join(', ')}`
                }
            }
        }

        // 5. Update procedures (using transaction to ensure atomicity)
        await prisma.$transaction(async (tx) => {
            // Remove all existing links for this dentist
            await tx.dentistProcedure.deleteMany({
                where: { dentistId }
            })

            // Add new links
            if (data.procedureIds.length > 0) {
                await tx.dentistProcedure.createMany({
                    data: data.procedureIds.map(procedureId => ({
                        dentistId,
                        procedureId
                    }))
                })
            }
        })

        return { success: true }

    } catch (error) {
        console.error('[UpdateDentistProcedures] Error:', error)
        return {
            success: false,
            error: 'Ocorreu um erro ao atualizar os procedimentos do dentista'
        }
    }
}
