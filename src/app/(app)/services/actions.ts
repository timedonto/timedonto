'use server'

import { auth } from "@/lib/auth"
import { specialtyRepository } from "@/modules/specialties/infra/specialty.repository"
import { procedureRepository } from "@/modules/procedures/infra/procedure.repository"
import { revalidatePath } from "next/cache"
import {
    createSpecialtySchema,
    updateSpecialtySchema
} from "@/modules/specialties/domain/specialty.schema"
import { UserRole } from "@prisma/client"
import { createProcedure } from "@/modules/procedures/application/create-procedure"
import { updateProcedure } from "@/modules/procedures/application/update-procedure"
import { deactivateProcedure, activateProcedure } from "@/modules/procedures/application/deactivate-procedure"

// Helper to check permissions
async function checkAuth(requiredRoles: UserRole[] = []) {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    const user = session.user as any // Cast to any to access role/clinicId

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        throw new Error("Forbidden")
    }

    return user
}

// --- SPECIALTIES ---

export async function getSpecialtiesAction() {
    const user = await checkAuth()
    return await specialtyRepository.findMany(user.clinicId)
}

export async function createSpecialtyAction(data: any) {
    const user = await checkAuth([UserRole.OWNER, UserRole.ADMIN])

    const validated = createSpecialtySchema.parse(data)

    await specialtyRepository.create(user.clinicId, validated)
    revalidatePath('/services')
    return { success: true }
}

export async function updateSpecialtyAction(data: any) {
    const user = await checkAuth([UserRole.OWNER, UserRole.ADMIN])

    const validated = updateSpecialtySchema.parse(data)
    if (!validated.id) throw new Error("ID required")

    await specialtyRepository.update(validated.id, user.clinicId, validated)
    revalidatePath('/services')
    return { success: true }
}

export async function toggleSpecialtyStatusAction(id: string, isActive: boolean) {
    const user = await checkAuth([UserRole.OWNER, UserRole.ADMIN])

    await specialtyRepository.update(id, user.clinicId, { id, isActive })
    revalidatePath('/services')
    return { success: true }
}

// --- PROCEDURES ---

export async function getProceduresAction(specialtyId?: string) {
    const user = await checkAuth()
    return await procedureRepository.findMany(user.clinicId, { specialtyId })
}

export async function createProcedureAction(data: any) {
    const user = await checkAuth([UserRole.OWNER, UserRole.ADMIN])

    // P0.3 - Usar Use Case
    const result = await createProcedure({
        clinicId: user.clinicId,
        currentUserRole: user.role,
        data
    })

    if (!result.success) {
        throw new Error(result.error)
    }

    revalidatePath('/services')
    return { success: true }
}

export async function updateProcedureAction(data: any) {
    const user = await checkAuth([UserRole.OWNER, UserRole.ADMIN])

    if (!data.id) throw new Error("ID required")

    // P0.3 - Usar Use Case
    const result = await updateProcedure({
        procedureId: data.id,
        clinicId: user.clinicId,
        currentUserRole: user.role,
        data
    })

    if (!result.success) {
        throw new Error(result.error)
    }

    revalidatePath('/services')
    return { success: true }
}

export async function toggleProcedureStatusAction(id: string, isActive: boolean) {
    const user = await checkAuth([UserRole.OWNER, UserRole.ADMIN])

    // P0.4 - Usar Use Case com validação de uso
    const result = isActive
        ? await activateProcedure({
            procedureId: id,
            clinicId: user.clinicId,
            currentUserRole: user.role
        })
        : await deactivateProcedure({
            procedureId: id,
            clinicId: user.clinicId,
            currentUserRole: user.role
        })

    if (!result.success) {
        throw new Error(result.error)
    }

    revalidatePath('/services')
    return { success: true }
}
