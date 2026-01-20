import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/database'
import {
    CreateProcedureData,
    UpdateProcedureData,
    ListProceduresFilters,
    ProcedureOutput
} from '../domain/procedure.schema'

export class ProcedureRepository {

    async create(clinicId: string, data: CreateProcedureData): Promise<ProcedureOutput> {
        const procedure = await prisma.procedure.create({
            data: {
                clinicId,
                specialtyId: data.specialtyId,
                name: data.name,
                description: data.description || null,
                baseValue: data.baseValue,
                commissionPercentage: data.commissionPercentage,
                isActive: data.isActive ?? true,
            },
            include: {
                specialty: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        return this.mapToOutput(procedure)
    }

    async findMany(clinicId: string, filters?: ListProceduresFilters): Promise<ProcedureOutput[]> {
        const where: Prisma.ProcedureWhereInput = {
            clinicId,
        }

        if (filters?.specialtyId) {
            where.specialtyId = filters.specialtyId
        }

        if (filters?.search) {
            where.name = {
                contains: filters.search,
                mode: 'insensitive'
            }
        }

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive
        }

        const procedures = await prisma.procedure.findMany({
            where,
            include: {
                specialty: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        return procedures.map(this.mapToOutput)
    }

    async findById(id: string, clinicId: string): Promise<ProcedureOutput | null> {
        const procedure = await prisma.procedure.findFirst({
            where: {
                id,
                clinicId
            },
            include: {
                specialty: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        return procedure ? this.mapToOutput(procedure) : null
    }

    async update(id: string, clinicId: string, data: UpdateProcedureData): Promise<ProcedureOutput | null> {
        const updateData: Prisma.ProcedureUpdateInput = {}

        if (data.specialtyId !== undefined) {
            updateData.specialty = { connect: { id: data.specialtyId } }
        }

        if (data.name !== undefined) {
            updateData.name = data.name
        }

        if (data.description !== undefined) {
            updateData.description = data.description || null
        }

        if (data.baseValue !== undefined) {
            updateData.baseValue = data.baseValue
        }

        if (data.commissionPercentage !== undefined) {
            updateData.commissionPercentage = data.commissionPercentage
        }

        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive
        }

        const procedure = await prisma.procedure.update({
            where: {
                id,
                clinicId
            },
            data: updateData,
            include: {
                specialty: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        return this.mapToOutput(procedure)
    }

    async delete(id: string, clinicId: string): Promise<boolean> {
        try {
            await prisma.procedure.update({
                where: {
                    id,
                    clinicId
                },
                data: {
                    isActive: false
                }
            })
            return true
        } catch (error) {
            console.error('Erro ao inativar procedimento:', error)
            return false
        }
    }

    private mapToOutput(procedure: any): ProcedureOutput {
        return {
            id: procedure.id,
            clinicId: procedure.clinicId,
            specialtyId: procedure.specialtyId,
            name: procedure.name,
            description: procedure.description,
            baseValue: Number(procedure.baseValue),
            commissionPercentage: Number(procedure.commissionPercentage),
            isActive: procedure.isActive,
            createdAt: procedure.createdAt,
            updatedAt: procedure.updatedAt,
            specialty: procedure.specialty
        }
    }
}

export const procedureRepository = new ProcedureRepository()
