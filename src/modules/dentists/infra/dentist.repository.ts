import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/database'
import {
  CreateDentistInput,
  UpdateDentistInput,
  ListDentistsInput,
  DentistOutput
} from '../domain/dentist.schema'

export class DentistRepository {

  /**
   * Lista dentistas de uma clínica com filtros opcionais
   */
  async findMany(clinicId: string, filters?: ListDentistsInput): Promise<DentistOutput[]> {
    const where: Prisma.DentistWhereInput = {
      clinicId,
      user: {
        isActive: true
      }
    }

    // Aplicar filtros
    if (filters?.specialty) {
      where.specialty = {
        contains: filters.specialty,
        mode: 'insensitive'
      }
    }

    if (filters?.search) {
      where.OR = [
        {
          cro: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            isActive: true,
            name: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            isActive: true,
            email: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    const dentists = await prisma.dentist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          }
        },
        dentistProcedures: {
          include: {
            procedure: true
          }
        },
        dentistSpecialties: {
          include: {
            specialty: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    return dentists.map(this.mapToOutput)
  }

  /**
   * Busca dentista por ID validando que pertence à clínica
   */
  async findById(id: string, clinicId: string): Promise<DentistOutput | null> {
    const dentist = await prisma.dentist.findFirst({
      where: {
        id,
        clinicId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          }
        },
        dentistProcedures: {
          include: {
            procedure: true
          }
        },
        dentistSpecialties: {
          include: {
            specialty: true
          }
        }
      }
    })

    return dentist ? this.mapToOutput(dentist) : null
  }

  /**
   * Busca dentista pelo userId na clínica
   */
  async findByUserId(userId: string, clinicId: string): Promise<DentistOutput | null> {
    const dentist = await prisma.dentist.findFirst({
      where: {
        userId,
        clinicId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          }
        },
        dentistProcedures: {
          include: {
            procedure: true
          }
        },
        dentistSpecialties: {
          include: {
            specialty: true
          }
        }
      }
    })

    return dentist ? this.mapToOutput(dentist) : null
  }

  /**
   * Cria um novo dentista
   */
  async create(clinicId: string, data: CreateDentistInput): Promise<DentistOutput> {
    const dentist = await prisma.dentist.create({
      data: {
        clinicId,
        userId: data.userId,
        cro: data.cro,
        specialty: data.specialty || null,
        workingHours: (data.workingHours as any) || null,
        bankInfo: (data.bankInfo as any) || null,
        commission: data.commission ? new Prisma.Decimal(data.commission) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          }
        },
        dentistProcedures: {
          include: {
            procedure: true
          }
        },
        dentistSpecialties: {
          include: {
            specialty: true
          }
        }
      }
    })

    return this.mapToOutput(dentist)
  }

  /**
   * Atualiza um dentista existente
   */
  async update(id: string, clinicId: string, data: UpdateDentistInput): Promise<DentistOutput | null> {
    const updateData: Prisma.DentistUpdateInput = {}

    if (data.cro !== undefined) {
      updateData.cro = data.cro
    }

    if (data.specialty !== undefined) {
      updateData.specialty = data.specialty || null
    }

    if (data.workingHours !== undefined) {
      updateData.workingHours = (data.workingHours as any) || null
    }
    if (data.bankInfo !== undefined) {
      updateData.bankInfo = (data.bankInfo as any) || null
    }
    if (data.contactInfo !== undefined) {
      updateData.contactInfo = (data.contactInfo as any) || null
    }
    if (data.personalInfo !== undefined) {
      updateData.personalInfo = (data.personalInfo as any) || null
    }
    if (data.commission !== undefined) {
      updateData.commission = data.commission ? new Prisma.Decimal(data.commission) : null
    }

    const dentist = await prisma.dentist.update({
      where: {
        id,
        clinicId
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          }
        },
        dentistProcedures: {
          include: {
            procedure: true
          }
        },
        dentistSpecialties: {
          include: {
            specialty: true
          }
        }
      }
    })

    return this.mapToOutput(dentist)
  }

  /**
   * Verifica se um dentista pode ser deletado (sem vínculos)
   */
  async canDelete(id: string, clinicId: string): Promise<{
    canDelete: boolean
    reason?: string
  }> {
    // Verificar agendamentos futuros
    const futureAppointments = await prisma.appointment.count({
      where: {
        dentistId: id,
        clinicId,
        date: { gte: new Date() }
      }
    })

    if (futureAppointments > 0) {
      return {
        canDelete: false,
        reason: `Dentista possui ${futureAppointments} agendamento(s) futuro(s)`
      }
    }

    // Verificar prontuários
    const recordsCount = await prisma.record.count({
      where: { dentistId: id, clinicId }
    })

    if (recordsCount > 0) {
      return {
        canDelete: false,
        reason: `Dentista possui ${recordsCount} prontuário(s) registrado(s)`
      }
    }

    // Verificar planos de tratamento
    const treatmentPlansCount = await prisma.treatmentPlan.count({
      where: { dentistId: id, clinicId }
    })

    if (treatmentPlansCount > 0) {
      return {
        canDelete: false,
        reason: `Dentista possui ${treatmentPlansCount} plano(s) de tratamento`
      }
    }

    return { canDelete: true }
  }

  /**
   * Remove um dentista (hard delete)
   */
  async delete(id: string, clinicId: string): Promise<boolean> {
    try {
      await prisma.dentist.delete({
        where: {
          id,
          clinicId
        }
      })
      return true
    } catch (error) {
      console.error('Erro ao deletar dentista:', error)
      return false
    }
  }

  /**
   * Verifica se um usuário já é dentista na clínica
   */
  async userIsDentist(userId: string, clinicId: string): Promise<boolean> {
    const dentist = await prisma.dentist.findFirst({
      where: {
        userId,
        clinicId
      },
      select: { id: true }
    })

    return !!dentist
  }

  /**
   * Verifica se CRO já existe na clínica (para validação de unicidade)
   */
  async croExists(cro: string, clinicId: string, excludeDentistId?: string): Promise<boolean> {
    const where: Prisma.DentistWhereInput = {
      cro: cro.trim(),
      clinicId
    }

    if (excludeDentistId) {
      where.id = {
        not: excludeDentistId
      }
    }

    const dentist = await prisma.dentist.findFirst({
      where,
      select: { id: true }
    })

    return !!dentist
  }

  /**
   * Lista dentistas ativos para seletores (apenas dados básicos)
   */
  async findActiveDentists(clinicId: string): Promise<Pick<DentistOutput, 'id' | 'cro' | 'specialty' | 'user'>[]> {
    const dentists = await prisma.dentist.findMany({
      where: {
        clinicId,
        user: {
          isActive: true
        }
      },
      select: {
        id: true,
        cro: true,
        specialty: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    return dentists.map(dentist => ({
      id: dentist.id,
      cro: dentist.cro,
      specialty: dentist.specialty,
      user: dentist.user
    }))
  }

  /**
   * Conta total de dentistas ativos na clínica
   */
  async countActiveDentists(clinicId: string): Promise<number> {
    const count = await prisma.dentist.count({
      where: {
        clinicId,
        user: {
          isActive: true
        }
      }
    })

    return count
  }

  /**
   * Busca dentistas por especialidade
   */
  async findBySpecialty(clinicId: string, specialty: string): Promise<DentistOutput[]> {
    const dentists = await prisma.dentist.findMany({
      where: {
        clinicId,
        specialty: {
          contains: specialty,
          mode: 'insensitive'
        },
        user: {
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          }
        },
        dentistProcedures: {
          include: {
            procedure: true
          }
        },
        dentistSpecialties: {
          include: {
            specialty: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    return dentists.map(this.mapToOutput)
  }

  /**
   * Associa especialidades a um dentista (substitui associações existentes)
   */
  async associateSpecialties(dentistId: string, specialtyIds: string[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Remover associações existentes
      await tx.dentistSpecialty.deleteMany({
        where: {
          dentistId
        }
      })

      // Criar novas associações
      if (specialtyIds.length > 0) {
        const associationsData = specialtyIds.map(specialtyId => ({
          dentistId,
          specialtyId
        }))

        await tx.dentistSpecialty.createMany({
          data: associationsData
        })
      }
    })
  }

  /**
   * Remove uma especialidade específica de um dentista
   */
  async removeSpecialty(dentistId: string, specialtyId: string): Promise<boolean> {
    try {
      await prisma.dentistSpecialty.deleteMany({
        where: {
          dentistId,
          specialtyId
        }
      })
      return true
    } catch (error) {
      console.error('Erro ao remover especialidade do dentista:', error)
      return false
    }
  }

  /**
   * Busca especialidades de um dentista
   */
  async getSpecialties(dentistId: string): Promise<any[]> {
    const associations = await prisma.dentistSpecialty.findMany({
      where: {
        dentistId
      },
      include: {
        specialty: true
      }
    })

    return associations.map(assoc => assoc.specialty)
  }

  /**
   * Mapeia o resultado do Prisma para DentistOutput
   */
  private mapToOutput(dentist: any): DentistOutput {
    return {
      id: dentist.id,
      clinicId: dentist.clinicId,
      userId: dentist.userId,
      cro: dentist.cro,
      specialty: dentist.specialty,
      workingHours: dentist.workingHours,
      bankInfo: dentist.bankInfo,
      contactInfo: dentist.contactInfo,
      personalInfo: dentist.personalInfo,
      commission: dentist.commission ? Number(dentist.commission) : null,
      createdAt: dentist.createdAt,
      updatedAt: dentist.updatedAt,
      user: dentist.user,
      procedures: dentist.dentistProcedures?.map((dp: any) => ({
        ...dp.procedure,
        baseValue: Number(dp.procedure.baseValue),
        commissionPercentage: Number(dp.procedure.commissionPercentage)
      })) || [],
      specialties: dentist.dentistSpecialties?.map((ds: any) => ds.specialty) || []
    }
  }
}

// Exportar instância singleton
export const dentistRepository = new DentistRepository()