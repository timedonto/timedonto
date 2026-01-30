import { Prisma, AttendanceStatus } from '@/generated/client';
import { prisma } from '@/lib/database';
import {
  CreateAttendanceData,
  ListAttendancesFilters,
  AttendanceOutput
} from '../domain/attendance.schema';
import { attendanceCIDRepository } from './attendance-cid.repository';

export class AttendanceRepository {
  /**
   * Cria um novo atendimento
   */
  async create(clinicId: string, data: CreateAttendanceData, createdById: string, createdByRole: string): Promise<AttendanceOutput> {
    const attendance = await prisma.attendance.create({
      data: {
        clinicId,
        patientId: data.patientId,
        appointmentId: data.appointmentId || null,
        dentistId: data.dentistId || null,
        status: AttendanceStatus.CHECKED_IN,
        arrivalAt: new Date(),
        createdByRole: createdByRole as any,
        createdById,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        dentist: {
          select: {
            id: true,
            cro: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            status: true,
          }
        },
        cids: true,
        procedures: {
          include: {
            procedure: {
              select: {
                id: true,
                name: true,
                baseValue: true,
                description: true
              }
            },
            dentist: {
              select: {
                id: true,
                cro: true,
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        odontogram: true,
        documents: true,
      }
    });

    return this.mapToOutput(attendance);
  }

  /**
   * Busca atendimento por ID validando que pertence à clínica
   */
  async findById(id: string, clinicId: string): Promise<AttendanceOutput | null> {
    const attendance = await prisma.attendance.findFirst({
      where: {
        id,
        clinicId
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        dentist: {
          select: {
            id: true,
            cro: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            status: true,
          }
        },
        procedures: {
          include: {
            procedure: {
              select: {
                id: true,
                name: true,
                baseValue: true,
                description: true
              }
            },
            dentist: {
              select: {
                id: true,
                cro: true,
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        odontogram: true,
        documents: true,
      }
    });

    if (!attendance) {
      return null;
    }

    // Buscar CIDs usando o repository que inclui categorias
    const cidsWithCategories = await attendanceCIDRepository.findByAttendanceId(id);

    // Passar attendance com cids para mapToOutput
    return this.mapToOutput({ ...attendance, cids: cidsWithCategories });
  }

  /**
   * Lista atendimentos de uma clínica com filtros opcionais
   */
  async findMany(clinicId: string, filters?: ListAttendancesFilters): Promise<AttendanceOutput[]> {
    const where: Prisma.AttendanceWhereInput = {
      clinicId,
    };

    // Aplicar filtros
    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.dentistId) {
      where.dentistId = filters.dentistId;
    }

    // Filtros de data
    if (filters?.date) {
      const date = new Date(filters.date);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      // Incluir atendimentos onde:
      // 1. O check-in (arrivalAt) foi na data selecionada, OU
      // 2. O atendimento foi iniciado (startedAt) na data selecionada, OU
      // 3. O atendimento está em progresso (IN_PROGRESS) - sempre mostrar atendimentos ativos
      where.OR = [
        {
          arrivalAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        {
          startedAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        {
          status: AttendanceStatus.IN_PROGRESS
        }
      ];
    } else {
      const dateFilter: any = {};

      if (filters?.dateFrom) {
        dateFilter.gte = new Date(filters.dateFrom);
      }

      if (filters?.dateTo) {
        dateFilter.lte = new Date(filters.dateTo);
      }

      if (Object.keys(dateFilter).length > 0) {
        // Para range de datas, também considerar startedAt e atendimentos em progresso
        where.OR = [
          {
            arrivalAt: dateFilter
          },
          {
            startedAt: dateFilter
          },
          {
            status: AttendanceStatus.IN_PROGRESS
          }
        ];
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        dentist: {
          select: {
            id: true,
            cro: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            status: true,
          }
        },
        cids: true,
        procedures: {
          include: {
            procedure: {
              select: {
                id: true,
                name: true,
                baseValue: true,
                description: true
              }
            },
            dentist: {
              select: {
                id: true,
                cro: true,
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        odontogram: true,
        documents: true,
      },
      orderBy: {
        arrivalAt: 'desc'
      }
    });

    return attendances.map(this.mapToOutput);
  }

  /**
   * Lista fila de espera (CHECKED_IN) ordenada por chegada
   */
  async findWaitingRoom(clinicId: string, dentistId?: string): Promise<AttendanceOutput[]> {
    const where: Prisma.AttendanceWhereInput = {
      clinicId,
      status: AttendanceStatus.CHECKED_IN,
    };

    if (dentistId) {
      where.dentistId = dentistId;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        dentist: {
          select: {
            id: true,
            cro: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            status: true,
          }
        },
        cids: true,
        procedures: {
          include: {
            procedure: {
              select: {
                id: true,
                name: true,
                baseValue: true,
                description: true
              }
            },
            dentist: {
              select: {
                id: true,
                cro: true,
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        odontogram: true,
        documents: true,
      },
      orderBy: {
        arrivalAt: 'asc'
      }
    });

    return attendances.map(this.mapToOutput);
  }

  /**
   * Busca atendimento por appointmentId
   */
  async findByAppointmentId(appointmentId: string, clinicId: string): Promise<AttendanceOutput | null> {
    const attendance = await prisma.attendance.findFirst({
      where: {
        appointmentId,
        clinicId
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        dentist: {
          select: {
            id: true,
            cro: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            status: true,
          }
        },
        cids: true,
        procedures: {
          include: {
            procedure: {
              select: {
                id: true,
                name: true,
                baseValue: true,
                description: true
              }
            },
            dentist: {
              select: {
                id: true,
                cro: true,
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        odontogram: true,
        documents: true,
      }
    });

    return attendance ? this.mapToOutput(attendance) : null;
  }

  /**
   * Busca atendimento ativo por appointmentId (apenas CHECKED_IN ou IN_PROGRESS)
   */
  async findActiveByAppointmentId(appointmentId: string, clinicId: string): Promise<AttendanceOutput | null> {
    const attendance = await prisma.attendance.findFirst({
      where: {
        appointmentId,
        clinicId,
        status: {
          in: [AttendanceStatus.CHECKED_IN, AttendanceStatus.IN_PROGRESS]
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        dentist: {
          select: {
            id: true,
            cro: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            status: true,
          }
        },
        cids: true,
        procedures: {
          include: {
            procedure: {
              select: {
                id: true,
                name: true,
                baseValue: true,
                description: true
              }
            },
            dentist: {
              select: {
                id: true,
                cro: true,
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        odontogram: true,
        documents: true,
      }
    });

    return attendance ? this.mapToOutput(attendance) : null;
  }

  /**
   * Limpa appointmentId de atendimentos cancelados/finalizados para permitir novo check-in
   */
  async clearAppointmentIdFromInactiveAttendances(appointmentId: string, clinicId: string): Promise<void> {
    await prisma.attendance.updateMany({
      where: {
        appointmentId,
        clinicId,
        status: {
          in: [AttendanceStatus.CANCELED, AttendanceStatus.DONE]
        }
      },
      data: {
        appointmentId: null
      }
    });
  }

  /**
   * Atualiza um atendimento
   */
  async update(id: string, clinicId: string, data: Partial<{
    status: AttendanceStatus;
    dentistId: string | null;
    appointmentId: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
  }>): Promise<AttendanceOutput | null> {
    // Primeiro verificar se o atendimento existe e pertence à clínica
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        id,
        clinicId
      }
    });

    if (!existingAttendance) {
      return null;
    }

    const updateData: any = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.dentistId !== undefined) {
      updateData.dentistId = data.dentistId;
    }

    if (data.appointmentId !== undefined) {
      updateData.appointmentId = data.appointmentId;
    }

    if (data.startedAt !== undefined) {
      updateData.startedAt = data.startedAt;
    }

    if (data.finishedAt !== undefined) {
      updateData.finishedAt = data.finishedAt;
    }

    const attendance = await prisma.attendance.update({
      where: {
        id
      },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        dentist: {
          select: {
            id: true,
            cro: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        appointment: {
          select: {
            id: true,
            date: true,
            status: true,
          }
        },
        cids: true,
        procedures: {
          include: {
            procedure: {
              select: {
                id: true,
                name: true,
                baseValue: true,
                description: true
              }
            },
            dentist: {
              select: {
                id: true,
                cro: true,
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        odontogram: true,
        documents: true,
      }
    });

    return this.mapToOutput(attendance);
  }

  /**
   * Mapeia o resultado do Prisma para AttendanceOutput
   */
  private mapToOutput(attendance: any): AttendanceOutput {
    return {
      id: attendance.id,
      clinicId: attendance.clinicId,
      appointmentId: attendance.appointmentId,
      patientId: attendance.patientId,
      dentistId: attendance.dentistId,
      status: attendance.status,
      arrivalAt: attendance.arrivalAt,
      startedAt: attendance.startedAt,
      finishedAt: attendance.finishedAt,
      createdByRole: attendance.createdByRole,
      createdById: attendance.createdById,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
      patient: attendance.patient,
      dentist: attendance.dentist,
      appointment: attendance.appointment,
      cids: attendance.cids || [],
      procedures: attendance.procedures || [],
      odontogram: attendance.odontogram ? { data: attendance.odontogram.data as Record<string, string> } : null,
      documents: attendance.documents || [],
    };
  }
}

// Exportar instância singleton
export const attendanceRepository = new AttendanceRepository();
