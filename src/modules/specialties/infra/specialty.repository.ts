import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/database'
import {
    CreateSpecialtyData,
    UpdateSpecialtyData,
    ListSpecialtiesFilters,
    SpecialtyOutput
} from '../domain/specialty.schema'

export class SpecialtyRepository {

    /**
     * Cria uma nova especialidade vinculada à clínica
     */
    async create(clinicId: string, data: CreateSpecialtyData): Promise<SpecialtyOutput> {
        const specialty = await prisma.specialty.create({
            data: {
                clinicId,
                name: data.name,
                description: data.description || null,
                isActive: data.isActive ?? true,
            }
        })

        return this.mapToOutput(specialty)
    }

    /**
     * Lista especialidades por clínica com filtros opcionais
     */
    async findMany(clinicId: string, filters?: ListSpecialtiesFilters): Promise<SpecialtyOutput[]> {
        const where: Prisma.SpecialtyWhereInput = {
            clinicId,
        }

        // Aplicar filtro de busca por nome
        if (filters?.search) {
            where.name = {
                contains: filters.search,
                mode: 'insensitive'
            }
        }

        // Aplicar filtro de status ativo/inativo
        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive
        }

        const specialties = await prisma.specialty.findMany({
            where,
            orderBy: {
                name: 'asc'
            }
        })

        return specialties.map(this.mapToOutput)
    }

    /**
     * Busca uma especialidade por ID validando que pertence à clínica
     */
    async findById(id: string, clinicId: string): Promise<SpecialtyOutput | null> {
        const specialty = await prisma.specialty.findFirst({
            where: {
                id,
                clinicId
            }
        })

        return specialty ? this.mapToOutput(specialty) : null
    }

    /**
     * Atualiza uma especialidade existente
     */
    async update(id: string, clinicId: string, data: UpdateSpecialtyData): Promise<SpecialtyOutput | null> {
        const updateData: Prisma.SpecialtyUpdateInput = {}

        if (data.name !== undefined) {
            updateData.name = data.name
        }

        if (data.description !== undefined) {
            updateData.description = data.description || null
        }

        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive
        }

        const specialty = await prisma.specialty.update({
            where: {
                id,
                clinicId
            },
            data: updateData
        })

        return this.mapToOutput(specialty)
    }

    /**
     * Inativa uma especialidade (soft delete)
     */
    async delete(id: string, clinicId: string): Promise<boolean> {
        try {
            await prisma.specialty.update({
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
            console.error('Erro ao inativar especialidade:', error)
            return false
        }
    }

    /**
     * Verifica se uma especialidade com o mesmo nome já existe na clínica
     */
    async nameExists(name: string, clinicId: string, excludeSpecialtyId?: string): Promise<boolean> {
        const where: Prisma.SpecialtyWhereInput = {
            name: {
                equals: name.trim(),
                mode: 'insensitive'
            },
            clinicId,
            isActive: true
        }

        if (excludeSpecialtyId) {
            where.id = {
                not: excludeSpecialtyId
            }
        }

        const specialty = await prisma.specialty.findFirst({
            where,
            select: { id: true }
        })

        return !!specialty
    }

    /**
     * Lista especialidades ativas para seletores (apenas dados básicos)
     */
    async findActiveSpecialties(clinicId: string): Promise<Pick<SpecialtyOutput, 'id' | 'name'>[]> {
        const specialties = await prisma.specialty.findMany({
            where: {
                clinicId,
                isActive: true
            },
            select: {
                id: true,
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        })

        return specialties
    }

    /**
     * Conta total de especialidades ativas na clínica
     */
    async countActiveSpecialties(clinicId: string): Promise<number> {
        const count = await prisma.specialty.count({
            where: {
                clinicId,
                isActive: true
            }
        })

        return count
    }

    /**
     * Mapeia o resultado do Prisma para SpecialtyOutput
     */
    private mapToOutput(specialty: any): SpecialtyOutput {
        return {
            id: specialty.id,
            clinicId: specialty.clinicId,
            name: specialty.name,
            description: specialty.description,
            isActive: specialty.isActive,
            createdAt: specialty.createdAt,
            updatedAt: specialty.updatedAt
        }
    }
}

// Exportar instância singleton
export const specialtyRepository = new SpecialtyRepository()
