import { startAttendanceSchema, type StartAttendanceData } from '../domain/attendance.schema';
import { attendanceRepository } from '../infra/attendance.repository';
import { AttendanceStatus } from '@/generated/client';
import { prisma } from '@/lib/database';

export interface StartAttendanceParams {
  attendanceId: string;
  clinicId: string;
  data: StartAttendanceData;
  dentistUserId?: string;
  isOwner?: boolean;
}

export interface StartAttendanceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Dentista ou Proprietário inicia o atendimento (CHECKED_IN → IN_PROGRESS)
 */
export async function startAttendance(params: StartAttendanceParams): Promise<StartAttendanceResult> {
  const { attendanceId, clinicId, data, dentistUserId, isOwner = false } = params;

  try {
    // Validar dados de entrada
    const validation = startAttendanceSchema.safeParse(data);
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
    if (attendance.status !== AttendanceStatus.CHECKED_IN) {
      return {
        success: false,
        error: 'Apenas atendimentos em check-in podem ser iniciados'
      };
    }

    // Validar que o dentista existe e pertence à clínica
    const dentistWhere: any = {
      id: validatedData.dentistId,
      clinicId
    };

    // Se não for proprietário, validar que o dentista pertence ao usuário
    if (!isOwner && dentistUserId) {
      dentistWhere.userId = dentistUserId;
    }

    const dentist = await prisma.dentist.findFirst({
      where: dentistWhere
    });

    if (!dentist) {
      return {
        success: false,
        error: isOwner 
          ? 'Dentista não encontrado' 
          : 'Dentista não encontrado ou não autorizado'
      };
    }

    // Atualizar atendimento
    const updatedAttendance = await attendanceRepository.update(attendanceId, clinicId, {
      status: AttendanceStatus.IN_PROGRESS,
      dentistId: validatedData.dentistId,
      startedAt: new Date(),
    });

    return {
      success: true,
      data: updatedAttendance
    };

  } catch (error) {
    console.error('Erro ao iniciar atendimento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
