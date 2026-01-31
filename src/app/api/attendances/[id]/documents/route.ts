import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/roles';
import { auth } from '@/lib/auth';
import { createClinicalDocument } from '@/modules/attendance/application';
import { createDocumentWithIdSchema } from '@/modules/attendance/domain/attendance.schema';
import { clinicalDocumentRepository } from '@/modules/attendance/infra/clinical-document.repository';

/**
 * GET /api/attendances/[id]/documents
 * Lista documentos do atendimento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id: attendanceId } = await params;

    // Buscar documentos
    const documents = await clinicalDocumentRepository.findByAttendanceId(attendanceId);

    return NextResponse.json({
      success: true,
      data: documents
    });

  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendances/[id]/documents
 * Cria documento clínico
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.clinicId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar permissão (apenas DENTIST)
    const userRole = session.user.role as UserRole;
    if (userRole !== UserRole.DENTIST) {
      return NextResponse.json(
        { success: false, error: 'Apenas dentistas podem criar documentos clínicos' },
        { status: 403 }
      );
    }

    const { id: attendanceId } = await params;

    // Ler body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body da requisição inválido' },
        { status: 400 }
      );
    }

    // Validar
    const validation = createDocumentWithIdSchema.safeParse({
      id: attendanceId,
      data: body
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Chamar use case
    const result = await createClinicalDocument({
      attendanceId,
      clinicId: session.user.clinicId,
      data: body,
      generatedBy: session.user.id
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao criar documento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
