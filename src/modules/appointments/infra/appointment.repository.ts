import { Prisma, AppointmentStatus } from '@prisma/client'
import { prisma } from '@/lib/database'
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  ListAppointmentsInput,
  AppointmentOutput
} from '../domain/appointment.schema'

export class AppointmentRepository {

  /**
   * Lista agendamentos de uma clínica com filtros opcionais
   */
  async findMany(clinicId: string, filters?: ListAppointmentsInput): Promise<AppointmentOutput[]> {
    const where: Prisma.AppointmentWhereInput = {
      clinicId,
    }

    // Aplicar filtros
    if (filters?.dentistId) {
      where.dentistId = filters.dentistId
    }

    if (filters?.patientId) {
      where.patientId = filters.patientId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    // Filtros de data
    if (filters?.date) {
      // Filtro para data específica (dia inteiro)
      const date = new Date(filters.date)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

      where.date = {
        gte: startOfDay,
        lt: endOfDay
      }
    } else {
      // Filtros de intervalo de datas
      const dateFilter: any = {}

      if (filters?.dateFrom) {
        dateFilter.gte = new Date(filters.dateFrom)
      }

      if (filters?.dateTo) {
        dateFilter.lte = new Date(filters.dateTo)
      }

      if (Object.keys(dateFilter).length > 0) {
        where.date = dateFilter
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return appointments.map(this.mapToOutput)
  }

  /**
   * Busca agendamento por ID validando que pertence à clínica
   */
  async findById(id: string, clinicId: string): Promise<AppointmentOutput | null> {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        clinicId
      },
      include: {
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    return appointment ? this.mapToOutput(appointment) : null
  }

  /**
   * Cria um novo agendamento
   */
  async create(clinicId: string, data: CreateAppointmentInput): Promise<AppointmentOutput> {
    const appointment = await prisma.appointment.create({
      data: {
        clinicId,
        dentistId: data.dentistId,
        patientId: data.patientId,
        date: new Date(data.date),
        durationMinutes: data.durationMinutes,
        status: data.status,
        procedure: data.procedure || null,
        procedureId: (data as any).procedureId || null,
        procedureSnapshot: (data as any).procedureSnapshot || null,
        notes: data.notes || null,
      },
      include: {
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    return this.mapToOutput(appointment)
  }

  /**
   * Atualiza um agendamento existente
   */
  async update(id: string, clinicId: string, data: UpdateAppointmentInput): Promise<AppointmentOutput | null | any> {
    const updateData: any = {}

    if (data.dentistId !== undefined) {
      updateData.dentistId = data.dentistId
    }

    if (data.patientId !== undefined) {
      updateData.patientId = data.patientId
    }

    if (data.date !== undefined) {
      updateData.date = new Date(data.date)
    }

    if (data.durationMinutes !== undefined) {
      updateData.durationMinutes = data.durationMinutes
    }

    if (data.status !== undefined) {
      updateData.status = data.status
    }

    if (data.procedure !== undefined) {
      updateData.procedure = data.procedure || null
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes || null
    }

    // P0.2 - Suporte para procedureId e procedureSnapshot
    if ((data as any).procedureId !== undefined) {
      updateData.procedureId = (data as any).procedureId || null
    }

    if ((data as any).procedureSnapshot !== undefined) {
      updateData.procedureSnapshot = (data as any).procedureSnapshot || null
    }

    // P0.3 - CRÍTICO: Validar clinicId para garantir isolamento multi-tenant
    const appointment = await prisma.appointment.update({
      where: {
        id,
        clinicId  // Garantir que o agendamento pertence à clínica
      },
      data: updateData,
      include: {
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    return this.mapToOutput(appointment)
  }

  /**
   * Verifica se existe conflito de horário para o dentista
   */
  async checkConflict(
    clinicId: string,
    dentistId: string,
    date: string,
    durationMinutes: number,
    excludeId?: string
  ): Promise<boolean> {
    const appointmentDate = new Date(date)

    // Para uma verificação mais precisa de conflito, vamos buscar todos os agendamentos do dentista no dia
    // e verificar conflitos em memória
    const dayStart = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate())
    const dayEnd = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1)

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        dentistId,
        date: {
          gte: dayStart,
          lt: dayEnd
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED]
        },
        ...(excludeId && { id: { not: excludeId } })
      },
      select: {
        id: true,
        date: true,
        durationMinutes: true
      }
    })

    // Verificar conflitos em memória
    for (const existing of existingAppointments) {
      const existingStart = existing.date.getTime()
      const existingEnd = existingStart + (existing.durationMinutes * 60 * 1000)
      const newStart = appointmentDate.getTime()
      const newEnd = newStart + (durationMinutes * 60 * 1000)

      // Verifica se há sobreposição (sem contar as bordas exatas)
      if (
        (newStart >= existingStart && newStart < existingEnd) || // Novo inicia durante existente
        (newEnd > existingStart && newEnd <= existingEnd) || // Novo termina durante existente
        (newStart <= existingStart && newEnd >= existingEnd) // Novo engloba existente
      ) {
        return true // Há conflito
      }
    }

    return false // Não há conflito
  }

  /**
   * Remove um agendamento (soft delete - cancela o agendamento)
   */
  async delete(id: string, clinicId: string): Promise<AppointmentOutput | null> {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELED
      },
      include: {
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    return this.mapToOutput(appointment)
  }

  /**
   * Lista agendamentos por dentista em um período
   */
  async findByDentistAndDateRange(
    clinicId: string,
    dentistId: string,
    startDate: string,
    endDate: string
  ): Promise<AppointmentOutput[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        dentistId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return appointments.map(this.mapToOutput)
  }

  /**
   * Lista agendamentos por paciente
   */
  async findByPatient(clinicId: string, patientId: string): Promise<AppointmentOutput[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        patientId
      },
      include: {
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return appointments.map(this.mapToOutput)
  }

  /**
   * Conta agendamentos por status em uma clínica
   */
  async countByStatus(clinicId: string, status: AppointmentStatus): Promise<number> {
    const count = await prisma.appointment.count({
      where: {
        clinicId,
        status
      }
    })

    return count
  }

  /**
   * Lista próximos agendamentos (hoje e próximos dias)
   */
  async findUpcoming(clinicId: string, limit: number = 10): Promise<AppointmentOutput[]> {
    const now = new Date()

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        date: {
          gte: now
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        }
      },
      include: {
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: limit
    })

    return appointments.map(this.mapToOutput)
  }

  /**
   * Lista agendamentos de hoje
   */
  async findToday(clinicId: string): Promise<AppointmentOutput[]> {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return appointments.map(this.mapToOutput)
  }

  /**
   * Mapeia o resultado do Prisma para AppointmentOutput
   */
  private mapToOutput(appointment: any): AppointmentOutput {
    return {
      id: appointment.id,
      clinicId: appointment.clinicId,
      dentistId: appointment.dentistId,
      patientId: appointment.patientId,
      date: appointment.date,
      durationMinutes: appointment.durationMinutes,
      status: appointment.status,
      procedure: appointment.procedure,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      dentist: appointment.dentist,
      patient: appointment.patient
    }
  }
}

// Exportar instância singleton
export const appointmentRepository = new AppointmentRepository()