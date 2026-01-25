import { addCIDSchema, type AddCIDData } from '../domain/attendance.schema';
import { attendanceRepository } from '../infra/attendance.repository';
import { attendanceCIDRepository } from '../infra/attendance-cid.repository';
import { AttendanceStatus } from '@prisma/client';
import { prisma } from '@/lib/database';

export interface AddAttendanceCIDParams {
  attendanceId: string;
  clinicId: string;
  data: AddCIDData;
  dentistId: string;
}

export interface AddAttendanceCIDResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Adiciona um CID ao atendimento
 * DENTIST ou OWNER podem adicionar
 * Atendimento deve estar IN_PROGRESS ou DONE
 */
export async function addAttendanceCID(params: AddAttendanceCIDParams): Promise<AddAttendanceCIDResult> {
  const { attendanceId, clinicId, data, dentistId } = params;

  try {
    // Validar dados de entrada
    const validation = addCIDSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      };
    }

    const validatedData = validation.data;

    // Buscar atendimento
    const attendance = await attendanceRepository.findById(attendanceId, clinicId);

    if (!attendance) {
      return {
        success: false,
        error: 'Atendimento não encontrado'
      };
    }

    // Validar status
    if (attendance.status !== AttendanceStatus.IN_PROGRESS && attendance.status !== AttendanceStatus.DONE) {
      return {
        success: false,
        error: 'CID só pode ser adicionado em atendimentos em andamento ou finalizados'
      };
    }

    // Validar que o dentista existe
    const dentist = await prisma.dentist.findFirst({
      where: {
        id: dentistId,
        clinicId
      }
    });

    if (!dentist) {
      return {
        success: false,
        error: 'Dentista não encontrado'
      };
    }

    // Criar CID
    const cid = await attendanceCIDRepository.create(attendanceId, validatedData, dentistId);

    // Buscar atendimento atualizado
    const updatedAttendance = await attendanceRepository.findById(attendanceId, clinicId);

    return {
      success: true,
      data: updatedAttendance
    };

  } catch (error) {
    console.error('Erro ao adicionar CID:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
