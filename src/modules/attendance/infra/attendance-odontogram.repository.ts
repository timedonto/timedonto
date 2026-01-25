import { prisma } from '@/lib/database';
import { UpdateOdontogramData } from '../domain/attendance.schema';

export class AttendanceOdontogramRepository {
  /**
   * Cria ou atualiza o odontograma do atendimento
   */
  async upsert(attendanceId: string, data: UpdateOdontogramData) {
    return await prisma.attendanceOdontogram.upsert({
      where: {
        attendanceId
      },
      create: {
        attendanceId,
        data: data.data as any,
      },
      update: {
        data: data.data as any,
      }
    });
  }

  /**
   * Busca o odontograma de um atendimento
   */
  async findByAttendanceId(attendanceId: string) {
    return await prisma.attendanceOdontogram.findUnique({
      where: {
        attendanceId
      }
    });
  }
}

// Exportar instância singleton
export const attendanceOdontogramRepository = new AttendanceOdontogramRepository();
