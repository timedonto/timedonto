import { prisma } from '@/lib/database';
import { CreateDocumentData } from '../domain/attendance.schema';
import { ClinicalDocumentType } from '@/generated/client';

export class ClinicalDocumentRepository {
  /**
   * Cria um novo documento clínico
   */
  async create(attendanceId: string, data: CreateDocumentData, generatedBy: string) {
    return await prisma.clinicalDocument.create({
      data: {
        attendanceId,
        type: data.type as ClinicalDocumentType,
        payload: data.payload as any,
        generatedBy,
      }
    });
  }

  /**
   * Lista todos os documentos de um atendimento
   */
  async findByAttendanceId(attendanceId: string) {
    return await prisma.clinicalDocument.findMany({
      where: {
        attendanceId
      },
      orderBy: {
        generatedAt: 'desc'
      }
    });
  }

  /**
   * Busca um documento por ID
   */
  async findById(id: string, attendanceId: string) {
    return await prisma.clinicalDocument.findFirst({
      where: {
        id,
        attendanceId
      }
    });
  }
}

// Exportar instância singleton
export const clinicalDocumentRepository = new ClinicalDocumentRepository();
