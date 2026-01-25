import { attendanceRepository } from '../infra/attendance.repository';

export interface ListWaitingRoomParams {
  clinicId: string;
  dentistId?: string;
}

export interface ListWaitingRoomResult {
  success: boolean;
  data?: any[];
  error?: string;
}

/**
 * Lista fila de espera (atendimentos em CHECKED_IN)
 * Ordenada por ordem de chegada (arrivalAt)
 */
export async function listWaitingRoom(params: ListWaitingRoomParams): Promise<ListWaitingRoomResult> {
  const { clinicId, dentistId } = params;

  try {
    const attendances = await attendanceRepository.findWaitingRoom(clinicId, dentistId);

    console.log('📋 Fila de espera:', {
      clinicId,
      dentistId,
      count: attendances.length,
      attendances: attendances.map(a => ({
        id: a.id,
        status: a.status,
        patientName: a.patient.name,
        appointmentId: a.appointmentId
      }))
    });

    return {
      success: true,
      data: attendances
    };

  } catch (error) {
    console.error('Erro ao listar fila de espera:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
