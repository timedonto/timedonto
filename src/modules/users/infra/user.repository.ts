import bcrypt from 'bcryptjs'
import { UserRole } from '@/generated/client'
import { prisma } from '@/lib/database'
import {
  CreateUserInput,
  UpdateUserInput,
  ListUsersInput,
  UserOutput
} from '../domain/user.schema'

export class UserRepository {
  private readonly SALT_ROUNDS = 10

  /**
   * Lista usuários de uma clínica com filtros opcionais
   */
  async findMany(clinicId: string, filters?: ListUsersInput): Promise<UserOutput[]> {
    const where: any = {
      clinicId,
    }

    // Aplicar filtros
    if (filters?.role) {
      where.role = filters.role
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return users
  }

  /**
   * Busca usuário por ID validando que pertence à clínica
   */
  async findById(id: string, clinicId: string): Promise<UserOutput | null> {
    const user = await prisma.user.findFirst({
      where: {
        id,
        clinicId
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return user
  }

  /**
   * Busca usuário por email na clínica
   */
  async findByEmail(email: string, clinicId: string): Promise<UserOutput | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        clinicId
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return user
  }

  /**
   * Busca usuário por email com senha para autenticação
   */
  async findByEmailWithPassword(email: string, clinicId: string) {
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        clinicId
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return user
  }

  /**
   * Cria um novo usuário
   */
  async create(clinicId: string, data: CreateUserInput): Promise<UserOutput> {
    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        clinicId,
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return user
  }

  /**
   * Atualiza um usuário existente
   */
  async update(id: string, clinicId: string, data: UpdateUserInput): Promise<UserOutput | null> {
    const updateData: any = {}

    if (data.name !== undefined) {
      updateData.name = data.name
    }

    if (data.email !== undefined) {
      updateData.email = data.email.toLowerCase()
    }

    if (data.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS)
    }

    if (data.role !== undefined) {
      updateData.role = data.role
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    const user = await prisma.user.update({
      where: {
        id,
        clinicId
      },
      data: updateData,
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return user
  }

  /**
   * Conta usuários por role em uma clínica
   */
  async countByRole(clinicId: string, role: UserRole): Promise<number> {
    const count = await prisma.user.count({
      where: {
        clinicId,
        role,
        isActive: true
      }
    })

    return count
  }

  /**
   * Verifica se o usuário é o único OWNER ativo da clínica
   */
  async isOnlyOwner(userId: string, clinicId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        clinicId,
        role: UserRole.OWNER,
        isActive: true
      }
    })

    if (!user) {
      return false
    }

    const ownerCount = await this.countByRole(clinicId, UserRole.OWNER)
    return ownerCount === 1
  }

  /**
   * Deleta um usuário (soft delete - marca como inativo)
   */
  async delete(id: string, clinicId: string): Promise<UserOutput | null> {
    const user = await prisma.user.update({
      where: {
        id,
        clinicId
      },
      data: {
        isActive: false
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return user
  }

  /**
   * Verifica se email já existe na clínica (para validação de unicidade)
   */
  async emailExists(email: string, clinicId: string, excludeUserId?: string): Promise<boolean> {
    const where: any = {
      email: email.toLowerCase(),
      clinicId
    }

    if (excludeUserId) {
      where.id = {
        not: excludeUserId
      }
    }

    const user = await prisma.user.findFirst({
      where,
      select: { id: true }
    })

    return !!user
  }

  /**
   * Verifica senha do usuário
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  /**
   * Lista todos os usuários ativos de uma clínica (para seletores)
   */
  async findActiveUsers(clinicId: string): Promise<Pick<UserOutput, 'id' | 'name' | 'email' | 'role'>[]> {
    const users = await prisma.user.findMany({
      where: {
        clinicId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return users
  }
}

// Exportar instância singleton
export const userRepository = new UserRepository()