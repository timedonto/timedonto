import { finishAttendanceSchema } from '../domain/attendance.schema';
import { attendanceRepository } from '../infra/attendance.repository';
import { attendanceCIDRepository } from '../infra/attendance-cid.repository';
import { attendanceProcedureRepository } from '../infra/attendance-procedure.repository';
import { AttendanceStatus } from '@/generated/client';
import { prisma } from '@/lib/database';
import { createRecord } from '@/modules/records/application/create-record';

export interface FinishAttendanceParams {
  attendanceId: string;
  clinicId: string;
}

export interface FinishAttendanceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Finaliza o atendimento (IN_PROGRESS → DONE)
 * Valida que tem CID e procedimentos
 * Gera Record automaticamente
 */
export async function finishAttendance(params: FinishAttendanceParams): Promise<FinishAttendanceResult> {
  const { attendanceId, clinicId } = params;

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
    if (attendance.status !== AttendanceStatus.IN_PROGRESS) {
      return {
        success: false,
        error: 'Apenas atendimentos em andamento podem ser finalizados'
      };
    }

    // Validar que tem CID
    const cids = await attendanceCIDRepository.findByAttendanceId(attendanceId);
    if (cids.length === 0) {
      return {
        success: false,
        error: 'É necessário adicionar pelo menos um CID antes de finalizar'
      };
    }

    // Validar que tem procedimentos
    const procedures = await attendanceProcedureRepository.findByAttendanceId(attendanceId);
    if (procedures.length === 0) {
      return {
        success: false,
        error: 'É necessário adicionar pelo menos um procedimento antes de finalizar'
      };
    }

    if (!attendance.dentistId) {
      return {
        success: false,
        error: 'Atendimento deve ter um dentista associado'
      };
    }

    // Usar transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      // Verificar novamente que o atendimento pertence à clínica (segurança adicional)
      const attendanceCheck = await tx.attendance.findFirst({
        where: {
          id: attendanceId,
          clinicId
        }
      });

      if (!attendanceCheck) {
        throw new Error('Atendimento não encontrado ou não pertence à clínica');
      }

      // Atualizar atendimento
      const updatedAttendance = await tx.attendance.update({
        where: {
          id: attendanceId
        },
        data: {
          status: AttendanceStatus.DONE,
          finishedAt: new Date(),
        },
        include: {
          patient: true,
          dentist: {
            include: {
              user: true
            }
          },
          appointment: true,
          cids: true,
          procedures: true,
          odontogram: true,
        }
      });

      // Gerar Record automaticamente
      const odontogramData = updatedAttendance.odontogram
        ? (updatedAttendance.odontogram.data as Record<string, string>)
        : undefined;

      const proceduresData = updatedAttendance.procedures.map(p => ({
        code: p.procedureCode || p.procedureId || 'PROC',
        description: p.description,
        tooth: p.tooth || undefined,
      }));

      // Criar descrição resumida do atendimento
      const description = `Atendimento realizado em ${new Date(updatedAttendance.arrivalAt).toLocaleDateString('pt-BR')}.\n` +
        `CIDs: ${updatedAttendance.cids.map(c => c.cidCode).join(', ')}\n` +
        `Procedimentos: ${updatedAttendance.procedures.map(p => p.description).join(', ')}`;

      await createRecord(clinicId, {
        patientId: updatedAttendance.patientId,
        dentistId: updatedAttendance.dentistId!,
        appointmentId: updatedAttendance.appointmentId || undefined,
        attendanceId: attendanceId,
        description,
        procedures: proceduresData,
        odontogram: odontogramData,
      });

      return updatedAttendance;
    });

    // Buscar atendimento completo para retornar
    const finalAttendance = await attendanceRepository.findById(attendanceId, clinicId);

    return {
      success: true,
      data: finalAttendance
    };

  } catch (error) {
    console.error('Erro ao finalizar atendimento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
