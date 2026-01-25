import { prisma } from '@/lib/database';
import { AddProcedureData } from '../domain/attendance.schema';

export class AttendanceProcedureRepository {
  /**
   * Cria um novo procedimento para o atendimento
   */
  async create(attendanceId: string, data: AddProcedureData & { price?: number; dentistId?: string }) {
    return await prisma.attendanceProcedure.create({
      data: {
        attendanceId,
        procedureId: data.procedureId || null,
        procedureCode: data.procedureCode || null, // Compatibilidade
        description: data.description || '',
        tooth: data.tooth || null,
        surface: data.surface || null, // Compatibilidade
        faces: data.faces || [],
        quantity: data.quantity || 1,
        clinicalStatus: data.clinicalStatus || null,
        price: data.price ? data.price : null,
        dentistId: data.dentistId || null,
        observations: data.observations || null,
      }
    });
  }

  /**
   * Lista todos os procedimentos de um atendimento
   */
  async findByAttendanceId(attendanceId: string) {
    return await prisma.attendanceProcedure.findMany({
      where: {
        attendanceId
      },
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
      },
      orderBy: {
        createdAt: 'desc' // Mais recente primeiro
      }
    });
  }

  /**
   * Remove um procedimento
   */
  async delete(id: string, attendanceId: string) {
    return await prisma.attendanceProcedure.delete({
      where: {
        id,
        attendanceId
      }
    });
  }
}

// Exportar instância singleton
export const attendanceProcedureRepository = new AttendanceProcedureRepository();
