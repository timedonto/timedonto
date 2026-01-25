import { createAttendanceSchema, type CreateAttendanceData } from '../domain/attendance.schema';
import { attendanceRepository } from '../infra/attendance.repository';
import { prisma } from '@/lib/database';
import { AttendanceStatus } from '@prisma/client';

export interface CheckInAttendanceParams {
  clinicId: string;
  data: CreateAttendanceData;
  createdById: string;
  createdByRole: string;
}

export interface CheckInAttendanceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Cria um novo atendimento (check-in)
 * Recepcionista ou Dentista pode criar
 */
export async function checkInAttendance(params: CheckInAttendanceParams): Promise<CheckInAttendanceResult> {
  const { clinicId, data, createdById, createdByRole } = params;

  try {
    // Validar dados de entrada
    const validation = createAttendanceSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      };
    }

    const validatedData = validation.data;

    // Validar que paciente existe e está ativo
    const patient = await prisma.patient.findFirst({
      where: {
        id: validatedData.patientId,
        clinicId,
        isActive: true
      }
    });

    if (!patient) {
      return {
        success: false,
        error: 'Paciente não encontrado ou inativo'
      };
    }

    // Se appointmentId fornecido, validar e pegar dentista
    let dentistId: string | undefined = validatedData.dentistId;
    
    if (validatedData.appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: validatedData.appointmentId,
          clinicId
        },
        select: {
          id: true,
          dentistId: true
        }
      });

      if (!appointment) {
        return {
          success: false,
          error: 'Agendamento não encontrado'
        };
      }

      // Se não foi informado dentistId, usar o do agendamento
      if (!dentistId && appointment.dentistId) {
        dentistId = appointment.dentistId;
      }

      // Verificar se appointment já tem attendance ativo
      const existingActiveAttendance = await attendanceRepository.findActiveByAppointmentId(
        validatedData.appointmentId,
        clinicId
      );

      if (existingActiveAttendance) {
        return {
          success: false,
          error: 'Este agendamento já possui um atendimento em andamento'
        };
      }

      // Limpar appointmentId de atendimentos cancelados/finalizados para permitir novo check-in
      // Isso resolve o problema da constraint única quando há atendimentos antigos
      await attendanceRepository.clearAppointmentIdFromInactiveAttendances(
        validatedData.appointmentId,
        clinicId
      );
    }

    // Criar atendimento com dentistId (do agendamento ou informado)
    const attendance = await attendanceRepository.create(
      clinicId,
      {
        ...validatedData,
        dentistId
      },
      createdById,
      createdByRole
    );

    console.log('✅ Atendimento criado com sucesso:', {
      id: attendance.id,
      status: attendance.status,
      patientId: attendance.patientId,
      appointmentId: attendance.appointmentId
    });

    return {
      success: true,
      data: attendance
    };

  } catch (error: any) {
    console.error('Erro ao fazer check-in:', error);
    
    // Tratar erros específicos do Prisma
    if (error?.code === 'P2002') {
      const target = error?.meta?.target;
      if (Array.isArray(target) && target.includes('appointmentId')) {
        return {
          success: false,
          error: 'Este agendamento já possui um atendimento. Por favor, cancele o atendimento anterior primeiro.'
        };
      }
      return {
        success: false,
        error: 'Já existe um registro com esses dados. Verifique se o agendamento já possui um atendimento.'
      };
    }
    
    // Tratar outros erros do Prisma
    if (error?.code?.startsWith('P')) {
      return {
        success: false,
        error: `Erro no banco de dados: ${error.message || 'Erro desconhecido'}`
      };
    }
    
    // Erro genérico
    return {
      success: false,
      error: error?.message || 'Erro interno do servidor'
    };
  }
}
