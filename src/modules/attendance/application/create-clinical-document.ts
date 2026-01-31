import { createDocumentSchema, type CreateDocumentData } from '../domain/attendance.schema';
import { attendanceRepository } from '../infra/attendance.repository';
import { clinicalDocumentRepository } from '../infra/clinical-document.repository';
import { AttendanceStatus } from '@/generated/client';

export interface CreateClinicalDocumentParams {
  attendanceId: string;
  clinicId: string;
  data: CreateDocumentData;
  generatedBy: string;
}

export interface CreateClinicalDocumentResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Cria um documento clínico vinculado ao atendimento
 * Apenas DENTIST pode criar
 * Atendimento deve estar DONE
 */
export async function createClinicalDocument(params: CreateClinicalDocumentParams): Promise<CreateClinicalDocumentResult> {
  const { attendanceId, clinicId, data, generatedBy } = params;

  try {
    // Validar dados de entrada
    const validation = createDocumentSchema.safeParse(data);
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
    if (attendance.status !== AttendanceStatus.DONE) {
      return {
        success: false,
        error: 'Documentos só podem ser gerados para atendimentos finalizados'
      };
    }

    // Criar documento
    const document = await clinicalDocumentRepository.create(attendanceId, validatedData, generatedBy);

    // Buscar atendimento atualizado
    const updatedAttendance = await attendanceRepository.findById(attendanceId, clinicId);

    return {
      success: true,
      data: {
        document,
        attendance: updatedAttendance
      }
    };

  } catch (error) {
    console.error('Erro ao criar documento clínico:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
