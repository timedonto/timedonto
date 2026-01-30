import { Prisma } from '@/generated/client'
import { prisma } from '@/lib/database'
import {
    ListSpecialtiesFilters,
    SpecialtyOutput
} from '../domain/specialty.schema'

export class SpecialtyRepository {

    /**
     * Lista todas as especialidades globais com filtros opcionais
     */
    async findMany(filters?: ListSpecialtiesFilters): Promise<SpecialtyOutput[]> {
        const where: Prisma.SpecialtyWhereInput = {}

        // Aplicar filtro de busca por nome
        if (filters?.search) {
            where.name = {
                contains: filters.search,
                mode: 'insensitive'
            }
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
     * Busca uma especialidade por ID
     */
    async findById(id: string): Promise<SpecialtyOutput | null> {
        const specialty = await prisma.specialty.findUnique({
            where: {
                id
            }
        })

        return specialty ? this.mapToOutput(specialty) : null
    }

    /**
     * Lista todas as especialidades para seletores (apenas dados básicos)
     */
    async findActiveSpecialties(): Promise<Pick<SpecialtyOutput, 'id' | 'name'>[]> {
        const specialties = await prisma.specialty.findMany({
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
     * Conta total de especialidades
     */
    async countSpecialties(): Promise<number> {
        const count = await prisma.specialty.count()
        return count
    }

    /**
     * Busca especialidade por nome exato
     */
    async findByName(name: string): Promise<SpecialtyOutput | null> {
        const specialty = await prisma.specialty.findFirst({
            where: {
                name: {
                    equals: name.trim(),
                    mode: 'insensitive'
                }
            }
        })

        return specialty ? this.mapToOutput(specialty) : null
    }

    /**
     * Mapeia o resultado do Prisma para SpecialtyOutput
     */
    private mapToOutput(specialty: any): SpecialtyOutput {
        return {
            id: specialty.id,
            name: specialty.name,
            description: specialty.description,
            createdAt: specialty.createdAt,
            updatedAt: specialty.updatedAt
        }
    }
}

// Exportar instância singleton
export const specialtyRepository = new SpecialtyRepository()