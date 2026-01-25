import { prisma } from '@/lib/database';
import { AddCIDData } from '../domain/attendance.schema';
import { cidRepository } from '@/modules/cids/infra/cid.repository';

export class AttendanceCIDRepository {
  /**
   * Cria um novo CID para o atendimento
   */
  async create(attendanceId: string, data: AddCIDData, createdByDentistId: string) {
    return await prisma.attendanceCID.create({
      data: {
        attendanceId,
        cidCode: data.cidCode,
        description: data.description,
        observation: data.observation || null,
        createdByDentistId,
      }
    });
  }

  /**
   * Lista todos os CIDs de um atendimento com categoria do CID original
   */
  async findByAttendanceId(attendanceId: string) {
    const attendanceCIDs = await prisma.attendanceCID.findMany({
      where: {
        attendanceId
      },
      orderBy: {
        id: 'asc'
      }
    });

    if (attendanceCIDs.length === 0) {
      return [];
    }

    // Buscar categorias usando o cidRepository
    const cidCategories: Record<string, string> = {};
    
    // Buscar todos os códigos únicos do atendimento
    const attendanceCodes = attendanceCIDs.map(cid => cid.cidCode.trim().toUpperCase());
    const codesSet = new Set(attendanceCodes);
    
    // Buscar todos os CIDs de uma vez usando o repository
    try {
      // Buscar todos os CIDs e filtrar pelos códigos que precisamos
      const allCIDs = await cidRepository.findAll();
      
      console.log(`🔍 Buscando categorias. CIDs no atendimento: ${codesSet.size}, CIDs no banco: ${allCIDs.length}`);
      console.log(`📋 Códigos do atendimento:`, Array.from(codesSet));
      
      // Criar mapa de código normalizado -> categoria
      allCIDs.forEach(cid => {
        const normalizedCode = cid.code.trim().toUpperCase();
        if (codesSet.has(normalizedCode)) {
          cidCategories[normalizedCode] = cid.category;
          console.log(`✅ Categoria encontrada para ${normalizedCode}: ${cid.category}`);
        }
      });
      
      console.log(`📊 Total de categorias encontradas: ${Object.keys(cidCategories).length}`);
      console.log(`📊 Categorias mapeadas:`, cidCategories);
    } catch (error) {
      console.error('❌ Erro ao buscar categorias dos CIDs:', error);
    }

    // Adicionar categoria a cada CID (usando código normalizado para busca)
    const result = attendanceCIDs.map(attendanceCID => {
      const normalizedCode = attendanceCID.cidCode.trim().toUpperCase();
      const category = cidCategories[normalizedCode] || null;
      console.log(`🔗 Mapeando ${attendanceCID.cidCode} (normalizado: ${normalizedCode}) -> categoria: ${category}`);
      return {
        ...attendanceCID,
        category
      };
    });
    
    console.log(`✅ Retornando ${result.length} CIDs com categorias`);
    return result;
  }

  /**
   * Remove um CID
   */
  async delete(id: string, attendanceId: string) {
    return await prisma.attendanceCID.delete({
      where: {
        id,
        attendanceId
      }
    });
  }
}

// Exportar instância singleton
export const attendanceCIDRepository = new AttendanceCIDRepository();
