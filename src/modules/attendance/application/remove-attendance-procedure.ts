import { attendanceRepository } from '../infra/attendance.repository';
import { attendanceProcedureRepository } from '../infra/attendance-procedure.repository';
import { AttendanceStatus } from '@/generated/client';

export interface RemoveAttendanceProcedureParams {
    attendanceId: string;
    clinicId: string;
    procedureId: string; // ID do registro de procedimento (AttendanceProcedure.id)
}

export interface RemoveAttendanceProcedureResult {
    success: boolean;
    error?: string;
}

/**
 * Remove um procedimento do atendimento
 * Apenas ADMIN, OWNER ou DENTIST pode remover
 * Atendimento deve estar IN_PROGRESS ou DONE
 */
export async function removeAttendanceProcedure(params: RemoveAttendanceProcedureParams): Promise<RemoveAttendanceProcedureResult> {
    const { attendanceId, clinicId, procedureId } = params;

    try {
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
                error: 'Procedimento só pode ser removido em atendimentos em andamento ou finalizados'
            };
        }

        // Verificar se o procedimento existe e pertence ao atendimento
        const procedures = await attendanceProcedureRepository.findByAttendanceId(attendanceId);
        const procedureExists = procedures.some(p => p.id === procedureId);

        if (!procedureExists) {
            return {
                success: false,
                error: 'Procedimento não encontrado neste atendimento'
            };
        }

        // Remover
        await attendanceProcedureRepository.delete(procedureId, attendanceId);

        return {
            success: true
        };

    } catch (error) {
        console.error('Erro ao remover procedimento:', error);
        return {
            success: false,
            error: 'Erro interno do servidor'
        };
    }
}
