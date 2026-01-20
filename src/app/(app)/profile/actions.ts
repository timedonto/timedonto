'use server'

import { auth } from '@/lib/auth'
import { dentistRepository } from '@/modules/dentists/infra/dentist.repository'
import { updateDentistProfile } from '@/modules/dentists/application'
import { UpdateDentistProfileInput } from '@/modules/dentists/domain/dentist.schema'
import { revalidatePath } from 'next/cache'

export async function getProfile() {
    const session = await auth()

    if (!session?.user?.id || !session?.user?.clinicId) {
        throw new Error('Não autenticado')
    }

    if (session.user.role !== 'DENTIST') {
        throw new Error('Acesso restrito a dentistas')
    }

    const dentist = await dentistRepository.findByUserId(
        session.user.id,
        session.user.clinicId
    )

    return {
        user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
        },
        dentist: dentist || null
    }
}

export async function updateProfileAction(data: UpdateDentistProfileInput) {
    const session = await auth()

    if (!session?.user?.id || !session?.user?.clinicId) {
        return { success: false, error: 'Não autenticado' }
    }

    if (session.user.role !== 'DENTIST') {
        return { success: false, error: 'Acesso restrito a dentistas' }
    }

    const result = await updateDentistProfile({
        userId: session.user.id,
        clinicId: session.user.clinicId,
        currentUserId: session.user.id,
        currentUserRole: session.user.role as any,
        data
    })

    if (result.success) {
        revalidatePath('/(app)/profile', 'page')
        revalidatePath('/(app)/dashboard', 'page')
    }

    return result
}
