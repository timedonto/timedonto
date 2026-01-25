import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database';
import { CIDOutput } from '../domain/cid.schema';

export class CIDRepository {
  /**
   * Lista todos os CIDs com busca opcional
   * Busca por código, categoria ou descrição (case-insensitive, partial match)
   */
  async search(query?: string): Promise<CIDOutput[]> {
    const where: Prisma.CIDWhereInput = {};

    if (query && query.trim().length > 0) {
      const searchTerm = query.trim();
      where.OR = [
        {
          code: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          category: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Tentar usar cID (com C maiúsculo) pois o modelo é CID
    let cids;
    try {
      console.log('🔍 Buscando CIDs no banco com query:', query);
      cids = await (prisma as any).cID.findMany({
        where,
        orderBy: [
          {
            code: 'asc',
          },
        ],
      });
      console.log(`✅ Encontrados ${cids.length} CIDs usando cID`);
    } catch (error) {
      console.log('⚠️ Erro ao usar cID, tentando cid:', error);
      // Se cID não funcionar, tentar cid
      try {
        cids = await (prisma as any).cid.findMany({
          where,
          orderBy: [
            {
              code: 'asc',
            },
          ],
        });
        console.log(`✅ Encontrados ${cids.length} CIDs usando cid`);
      } catch (err) {
        console.error('❌ Erro ao buscar CIDs:', err);
        throw err;
      }
    }

    return cids.map(this.mapToOutput);
  }

  /**
   * Busca um CID por código
   */
  async findByCode(code: string): Promise<CIDOutput | null> {
    const cid = await prisma.cid.findUnique({
      where: {
        code: code.toUpperCase(),
      },
    });

    return cid ? this.mapToOutput(cid) : null;
  }

  /**
   * Lista todos os CIDs
   */
  async findAll(): Promise<CIDOutput[]> {
    let cids;
    try {
      cids = await (prisma as any).cID.findMany({
        orderBy: {
          code: 'asc',
        },
      });
    } catch (error) {
      cids = await (prisma as any).cid.findMany({
        orderBy: {
          code: 'asc',
        },
      });
    }

    return cids.map(this.mapToOutput);
  }

  /**
   * Mapeia o resultado do Prisma para CIDOutput
   */
  private mapToOutput(cid: any): CIDOutput {
    return {
      id: cid.id,
      code: cid.code,
      category: cid.category,
      description: cid.description,
      createdAt: cid.createdAt,
      updatedAt: cid.updatedAt,
    };
  }
}

// Exportar instância singleton
export const cidRepository = new CIDRepository();
