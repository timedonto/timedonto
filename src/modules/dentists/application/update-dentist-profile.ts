import { UserRole } from '@prisma/client'
import { dentistRepository } from '../infra/dentist.repository'
import { userRepository } from '../../users/infra/user.repository'
import {
    updateDentistProfileSchema,
    UpdateDentistProfileInput,
    DentistOutput
} from '../domain/dentist.schema'

export interface UpdateDentistProfileParams {
    userId: string
    clinicId: string
    currentUserId: string
    currentUserRole: UserRole
    data: UpdateDentistProfileInput
}

export interface UpdateDentistProfileResult {
    success: boolean
    data?: DentistOutput
    error?: string
}

/**
 * Service to update a dentist's profile (self-update or admin update)
 */
export async function updateDentistProfile(params: UpdateDentistProfileParams): Promise<UpdateDentistProfileResult> {
    const { userId, clinicId, currentUserId, currentUserRole, data } = params

    try {
        // 1. Validate input data
        const validation = updateDentistProfileSchema.safeParse(data)
        if (!validation.success) {
            return {
                success: false,
                error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
            }
        }

        const validatedData = validation.data

        // 2. Authorization rule: User can only edit their own profile OR must be OWNER/ADMIN
        if (currentUserId !== userId && currentUserRole !== UserRole.OWNER && currentUserRole !== UserRole.ADMIN) {
            return {
                success: false,
                error: 'Você não tem permissão para editar este perfil'
            }
        }

        // 3. Find dentist record by userId
        const dentist = await dentistRepository.findByUserId(userId, clinicId)
        if (!dentist) {
            return {
                success: false,
                error: 'Dentista não encontrado'
            }
        }

        // 4. Validate Business Rules

        // Check Email Uniqueness if changed
        if (validatedData.email && validatedData.email !== dentist.user.email) {
            const emailExists = await userRepository.emailExists(validatedData.email, clinicId, userId)
            if (emailExists) {
                return {
                    success: false,
                    error: 'Este email já está em uso na clínica'
                }
            }
        }

        // Check CRO Uniqueness if changed
        if (validatedData.cro && validatedData.cro !== dentist.cro) {
            const croExists = await dentistRepository.croExists(validatedData.cro, clinicId, dentist.id)
            if (croExists) {
                return {
                    success: false,
                    error: 'Este CRO já está cadastrado nesta clínica'
                }
            }
        }

        // 5. Update data

        // Update User details (name, email)
        if (validatedData.name || validatedData.email) {
            await userRepository.update(userId, clinicId, {
                name: validatedData.name,
                email: validatedData.email
            })
        }

        // Update Dentist details
        const updatedDentist = await dentistRepository.update(dentist.id, clinicId, {
            cro: validatedData.cro,
            specialty: validatedData.specialty,
            workingHours: validatedData.workingHours,
            bankInfo: validatedData.bankInfo,
            commission: validatedData.commission
        })

        if (!updatedDentist) {
            return {
                success: false,
                error: 'Erro ao atualizar informações do dentista'
            }
        }

        return {
            success: true,
            data: updatedDentist
        }

    } catch (error) {
        console.error('[UpdateDentistProfile] Unexpected error:', error)
        return {
            success: false,
            error: 'Ocorreu um erro inesperado ao atualizar o perfil'
        }
    }
}
