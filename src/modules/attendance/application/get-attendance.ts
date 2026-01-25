import { attendanceRepository } from '../infra/attendance.repository';

export interface GetAttendanceParams {
  attendanceId: string;
  clinicId: string;
}

export interface GetAttendanceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Busca um atendimento por ID com todos os relacionamentos
 */
export async function getAttendance(params: GetAttendanceParams): Promise<GetAttendanceResult> {
  const { attendanceId, clinicId } = params;

  try {
    const attendance = await attendanceRepository.findById(attendanceId, clinicId);

    if (!attendance) {
      return {
        success: false,
        error: 'Atendimento não encontrado'
      };
    }

    return {
      success: true,
      data: attendance
    };

  } catch (error) {
    console.error('Erro ao buscar atendimento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
