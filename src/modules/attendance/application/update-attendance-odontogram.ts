import { updateOdontogramSchema, type UpdateOdontogramData } from '../domain/attendance.schema';
import { attendanceRepository } from '../infra/attendance.repository';
import { attendanceOdontogramRepository } from '../infra/attendance-odontogram.repository';
import { AttendanceStatus } from '@/generated/client';

export interface UpdateAttendanceOdontogramParams {
  attendanceId: string;
  clinicId: string;
  data: UpdateOdontogramData;
}

export interface UpdateAttendanceOdontogramResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Atualiza o odontograma do atendimento
 * Apenas DENTIST pode atualizar
 * Atendimento deve estar IN_PROGRESS ou DONE
 */
export async function updateAttendanceOdontogram(params: UpdateAttendanceOdontogramParams): Promise<UpdateAttendanceOdontogramResult> {
  const { attendanceId, clinicId, data } = params;

  try {
    // Validar dados de entrada
    const validation = updateOdontogramSchema.safeParse(data);
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
        error: 'Odontograma só pode ser atualizado em atendimentos em andamento ou finalizados'
      };
    }

    // Atualizar odontograma
    await attendanceOdontogramRepository.upsert(attendanceId, validatedData);

    // Buscar atendimento atualizado
    const updatedAttendance = await attendanceRepository.findById(attendanceId, clinicId);

    return {
      success: true,
      data: updatedAttendance
    };

  } catch (error) {
    console.error('Erro ao atualizar odontograma:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
