'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { dentistRepository } from '@/modules/dentists/infra/dentist.repository'
import { specialtyRepository } from '@/modules/specialties/infra/specialty.repository'
import { updateDentistProfile, updateDentist, associateDentistSpecialties } from '@/modules/dentists/application'
import { UpdateDentistProfileInput } from '@/modules/dentists/domain/dentist.schema'
import { UserRole } from '@prisma/client'

export async function getAvailableSpecialtiesAction() {
    const session = await auth()

    if (!session?.user?.id || !session?.user?.clinicId) {
        throw new Error('Não autenticado')
    }

    const specialties = await specialtyRepository.findMany()
    return specialties
}

export async function updateDentistProfileAction(
    dentistId: string,
    data: UpdateDentistProfileInput & { specialtyIds?: string[] }
) {
    const session = await auth()

    if (!session?.user?.id || !session?.user?.clinicId) {
        return { success: false, error: 'Não autenticado' }
    }

    // Buscar o dentista para obter o userId
    const dentist = await dentistRepository.findById(dentistId, session.user.clinicId)
    if (!dentist) {
        return { success: false, error: 'Dentista não encontrado' }
    }

    const userId = dentist.userId
    const currentUserId = session.user.id
    const currentUserRole = session.user.role as UserRole
    const clinicId = session.user.clinicId

    // Verificar permissões: OWNER/ADMIN podem editar qualquer dentista, DENTIST apenas o próprio
    const isOwnerOrAdmin = currentUserRole === UserRole.OWNER || currentUserRole === UserRole.ADMIN
    const isOwnProfile = currentUserId === userId

    if (!isOwnerOrAdmin && !isOwnProfile) {
        return { success: false, error: 'Você não tem permissão para editar este perfil' }
    }

    // Separar specialtyIds do resto dos dados
    const { specialtyIds, ...profileData } = data

    // Usar updateDentistProfile para auto-edição ou updateDentist para admin
    let result
    if (isOwnProfile && !isOwnerOrAdmin) {
        // Dentista editando próprio perfil
        result = await updateDentistProfile({
            userId,
            clinicId,
            currentUserId,
            currentUserRole,
            data: profileData
        })
    } else {
        // OWNER/ADMIN editando qualquer dentista
        // Para admin, precisamos atualizar via updateDentist (que não atualiza User)
        // Mas updateDentistProfile já faz isso, então vamos usar ele mesmo para admin
        result = await updateDentistProfile({
            userId,
            clinicId,
            currentUserId,
            currentUserRole,
            data: profileData
        })
    }

    // Se houver specialtyIds, associar especialidades (apenas OWNER/ADMIN)
    if (result.success && specialtyIds && specialtyIds.length > 0 && isOwnerOrAdmin) {
        const associateResult = await associateDentistSpecialties({
            clinicId,
            currentUserRole,
            data: {
                dentistId,
                specialtyIds
            }
        })

        if (!associateResult.success) {
            // Se falhar ao associar especialidades, ainda consideramos sucesso na atualização do perfil
            // mas logamos o erro
            console.error('Erro ao associar especialidades:', associateResult.error)
        }
    }

    if (result.success) {
        revalidatePath(`/dentists/${dentistId}`)
        revalidatePath('/dentists')
        revalidatePath('/profile')
    }

    return result
}
