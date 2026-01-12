import { prisma } from '@/lib/database'
import {
  CreatePatientInput,
  UpdatePatientInput,
  ListPatientsInput,
  PatientOutput
} from '../domain/patient.schema'

export class PatientRepository {
  /**
   * Lista pacientes de uma clínica com filtros opcionais
   */
  async findMany(clinicId: string, filters?: ListPatientsInput): Promise<PatientOutput[]> {
    const where: any = {
      clinicId,
    }

    // Aplicar filtros
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
        },
        {
          phone: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          cpf: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const patients = await prisma.patient.findMany({
      where,
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return patients
  }

  /**
   * Busca paciente por ID validando que pertence à clínica
   */
  async findById(id: string, clinicId: string): Promise<PatientOutput | null> {
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        clinicId
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return patient
  }

  /**
   * Busca paciente por CPF na clínica
   */
  async findByCpf(cpf: string, clinicId: string): Promise<PatientOutput | null> {
    const patient = await prisma.patient.findFirst({
      where: {
        cpf,
        clinicId
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return patient
  }

  /**
   * Cria um novo paciente
   */
  async create(clinicId: string, data: CreatePatientInput): Promise<PatientOutput> {
    const patient = await prisma.patient.create({
      data: {
        clinicId,
        name: data.name,
        email: data.email?.toLowerCase() || null,
        phone: data.phone || null,
        cpf: data.cpf || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address || null,
        notes: data.notes || null,
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return patient
  }

  /**
   * Atualiza um paciente existente
   */
  async update(id: string, clinicId: string, data: UpdatePatientInput): Promise<PatientOutput | null> {
    const updateData: any = {}

    if (data.name !== undefined) {
      updateData.name = data.name
    }

    if (data.email !== undefined) {
      updateData.email = data.email?.toLowerCase() || null
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone || null
    }

    if (data.cpf !== undefined) {
      updateData.cpf = data.cpf || null
    }

    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null
    }

    if (data.address !== undefined) {
      updateData.address = data.address || null
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes || null
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    const patient = await prisma.patient.update({
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
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return patient
  }

  /**
   * Verifica se CPF já existe na clínica (para validação de unicidade)
   */
  async cpfExists(cpf: string, clinicId: string, excludePatientId?: string): Promise<boolean> {
    const where: any = {
      cpf,
      clinicId
    }

    if (excludePatientId) {
      where.id = {
        not: excludePatientId
      }
    }

    const patient = await prisma.patient.findFirst({
      where,
      select: { id: true }
    })

    return !!patient
  }

  /**
   * Verifica se email já existe na clínica (para validação de unicidade)
   */
  async emailExists(email: string, clinicId: string, excludePatientId?: string): Promise<boolean> {
    const where: any = {
      email: email.toLowerCase(),
      clinicId
    }

    if (excludePatientId) {
      where.id = {
        not: excludePatientId
      }
    }

    const patient = await prisma.patient.findFirst({
      where,
      select: { id: true }
    })

    return !!patient
  }

  /**
   * Deleta um paciente (soft delete - marca como inativo)
   */
  async delete(id: string, clinicId: string): Promise<PatientOutput | null> {
    const patient = await prisma.patient.update({
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
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return patient
  }

  /**
   * Lista todos os pacientes ativos de uma clínica (para seletores)
   */
  async findActivePatients(clinicId: string): Promise<Pick<PatientOutput, 'id' | 'name' | 'email' | 'phone'>[]> {
    const patients = await prisma.patient.findMany({
      where: {
        clinicId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return patients
  }

  /**
   * Conta pacientes ativos em uma clínica
   */
  async countActivePatients(clinicId: string): Promise<number> {
    const count = await prisma.patient.count({
      where: {
        clinicId,
        isActive: true
      }
    })

    return count
  }
}

// Exportar instância singleton
export const patientRepository = new PatientRepository()