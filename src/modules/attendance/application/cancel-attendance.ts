import { cancelAttendanceSchema, type CancelAttendanceData } from '../domain/attendance.schema';
import { attendanceRepository } from '../infra/attendance.repository';
import { AttendanceStatus } from '@prisma/client';

export interface CancelAttendanceParams {
  attendanceId: string;
  clinicId: string;
  data?: CancelAttendanceData;
}

export interface CancelAttendanceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Cancela um atendimento (qualquer status → CANCELED)
 */
export async function cancelAttendance(params: CancelAttendanceParams): Promise<CancelAttendanceResult> {
  const { attendanceId, clinicId, data } = params;

  try {
    // Validar dados se fornecidos
    if (data) {
      const validation = cancelAttendanceSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false,
          error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
        };
      }
    }

    // Buscar atendimento
    const attendance = await attendanceRepository.findById(attendanceId, clinicId);

    if (!attendance) {
      return {
        success: false,
        error: 'Atendimento não encontrado'
      };
    }

    // Validar que não está já finalizado ou cancelado
    if (attendance.status === AttendanceStatus.DONE) {
      return {
        success: false,
        error: 'Não é possível cancelar um atendimento já finalizado'
      };
    }

    if (attendance.status === AttendanceStatus.CANCELED) {
      return {
        success: false,
        error: 'Atendimento já está cancelado'
      };
    }

    // Atualizar status e remover appointmentId para permitir novo check-in do mesmo agendamento
    const updatedAttendance = await attendanceRepository.update(attendanceId, clinicId, {
      status: AttendanceStatus.CANCELED,
      appointmentId: null, // Remove o appointmentId para permitir novo check-in
    });

    return {
      success: true,
      data: updatedAttendance
    };

  } catch (error) {
    console.error('Erro ao cancelar atendimento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
