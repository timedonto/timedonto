import { listAttendancesSchema, type ListAttendancesFilters } from '../domain/attendance.schema';
import { attendanceRepository } from '../infra/attendance.repository';

export interface ListAttendancesParams {
  clinicId: string;
  filters?: ListAttendancesFilters;
}

export interface ListAttendancesResult {
  success: boolean;
  data?: any[];
  error?: string;
}

/**
 * Lista atendimentos com filtros opcionais
 */
export async function listAttendances(params: ListAttendancesParams): Promise<ListAttendancesResult> {
  const { clinicId, filters } = params;

  try {
    // Validar filtros se fornecidos
    if (filters) {
      const validation = listAttendancesSchema.safeParse(filters);
      if (!validation.success) {
        return {
          success: false,
          error: `Filtros inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
        };
      }
    }

    const attendances = await attendanceRepository.findMany(clinicId, filters);

    return {
      success: true,
      data: attendances
    };

  } catch (error) {
    console.error('Erro ao listar atendimentos:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
