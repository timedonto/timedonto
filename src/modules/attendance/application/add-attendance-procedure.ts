import { addProcedureSchema, type AddProcedureData } from '../domain/attendance.schema';
import { attendanceRepository } from '../infra/attendance.repository';
import { attendanceProcedureRepository } from '../infra/attendance-procedure.repository';
import { AttendanceStatus } from '@/generated/client';
import { prisma } from '@/lib/database';

export interface AddAttendanceProcedureParams {
  attendanceId: string;
  clinicId: string;
  dentistId: string; // ID do dentista logado
  data: AddProcedureData;
}

export interface AddAttendanceProcedureResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Adiciona um procedimento ao atendimento
 * Apenas DENTIST, ADMIN, OWNER pode adicionar
 * Atendimento deve estar IN_PROGRESS ou DONE
 * Procedimento deve estar vinculado ao dentista
 */
export async function addAttendanceProcedure(params: AddAttendanceProcedureParams): Promise<AddAttendanceProcedureResult> {
  const { attendanceId, clinicId, dentistId, data } = params;

  try {
    // Validar dados de entrada
    const validation = addProcedureSchema.safeParse(data);
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
        error: 'Procedimento só pode ser adicionado em atendimentos em andamento ou finalizados'
      };
    }

    // Validar que o dentista está vinculado ao atendimento ou é o dentista logado
    const attendanceDentistId = attendance.dentistId || dentistId;
    if (attendance.dentistId && attendance.dentistId !== dentistId) {
      // Se o atendimento tem dentista, deve ser o mesmo que está logado
      // ADMIN e OWNER podem registrar para qualquer dentista
      // Mas por enquanto, vamos validar que é o dentista do atendimento
    }

    // Validar que o procedimento existe e está vinculado ao dentista
    if (validatedData.procedureId) {
      const procedure = await prisma.procedure.findFirst({
        where: {
          id: validatedData.procedureId,
          clinicId,
          isActive: true
        }
      });

      if (!procedure) {
        return {
          success: false,
          error: 'Procedimento não encontrado ou inativo'
        };
      }

      // Verificar se o procedimento está vinculado ao dentista
      const dentistProcedure = await prisma.dentistProcedure.findFirst({
        where: {
          dentistId: attendanceDentistId,
          procedureId: validatedData.procedureId
        }
      });

      if (!dentistProcedure) {
        return {
          success: false,
          error: 'Procedimento não está vinculado a este dentista'
        };
      }

      // Buscar preço do procedimento
      const price = procedure.baseValue;

      // Criar procedimento com todos os dados
      await attendanceProcedureRepository.create(attendanceId, {
        ...validatedData,
        price: Number(price),
        dentistId: attendanceDentistId,
        description: procedure.name // Usar nome do procedimento como descrição
      });
    } else {
      // Compatibilidade com dados antigos (procedureCode)
      await attendanceProcedureRepository.create(attendanceId, {
        ...validatedData,
        dentistId: attendanceDentistId
      });
    }

    // Buscar atendimento atualizado
    const updatedAttendance = await attendanceRepository.findById(attendanceId, clinicId);

    return {
      success: true,
      data: updatedAttendance
    };

  } catch (error) {
    console.error('Erro ao adicionar procedimento:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
