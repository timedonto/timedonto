'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { dentistRepository } from '@/modules/dentists/infra/dentist.repository'
import { updateDentistProcedures } from '@/modules/dentists/application/update-dentist-procedures'
import { prisma } from '@/lib/database'
import { UserRole } from '@/types/roles'

export async function getDentist(id: string) {
    const session = await auth()

    if (!session?.user?.id || !session?.user?.clinicId) {
        throw new Error('Não autenticado')
    }

    // Only OWNER/ADMIN can view full details or DENTIST can view their own
    const isSelf = session.user.id === id // userId matches

    const dentist = await dentistRepository.findById(id, session.user.clinicId)

    if (!dentist) return null

    const isOwnerOrAdmin = session.user.role === UserRole.OWNER || session.user.role === UserRole.ADMIN
    const isOwnProfile = session.user.id === dentist.userId

    if (!isOwnerOrAdmin && !isOwnProfile) {
        throw new Error('Acesso negado')
    }

    return dentist
}

export async function getAvailableProcedures() {
    const session = await auth()

    if (!session?.user?.clinicId) {
        throw new Error('Não autenticado')
    }

    const procedures = await prisma.procedure.findMany({
        where: {
            clinicId: session.user.clinicId,
            isActive: true
        },
        include: {
            specialty: true
        },
        orderBy: {
            name: 'asc'
        }
    })

    return procedures.map(p => ({
        ...p,
        baseValue: Number(p.baseValue),
        commissionPercentage: Number(p.commissionPercentage)
    }))
}

export async function updateDentistProceduresAction(dentistId: string, procedureIds: string[]) {
    const session = await auth()

    if (!session?.user?.id || !session?.user?.clinicId) {
        return { success: false, error: 'Não autenticado' }
    }

    const result = await updateDentistProcedures({
        dentistId,
        clinicId: session.user.clinicId,
        currentUserRole: session.user.role as any,
        data: {
            procedureIds
        }
    })

    if (result.success) {
        revalidatePath(`/dentists/${dentistId}`)
        revalidatePath('/dentists')
    }

    return result
}
