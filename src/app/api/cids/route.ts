import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cidRepository } from '@/modules/cids/infra/cid.repository';
import { searchCIDsSchema } from '@/modules/cids/domain/cid.schema';

/**
 * GET /api/cids?q=query
 * Busca CIDs por código, categoria ou descrição
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Obter query string
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // Validar
    const validation = searchCIDsSchema.safeParse({ q: query });
    if (!validation.success && query) {
      return NextResponse.json(
        {
          success: false,
          error: `Query inválida: ${validation.error.issues.map(i => i.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Buscar CIDs
    const cids = query.trim()
      ? await cidRepository.search(query)
      : await cidRepository.findAll();

    return NextResponse.json({
      success: true,
      data: cids,
    });
  } catch (error) {
    console.error('Erro ao buscar CIDs:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
