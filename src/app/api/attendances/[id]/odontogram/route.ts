import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { updateAttendanceOdontogram } from '@/modules/attendance/application';
import { updateOdontogramWithIdSchema } from '@/modules/attendance/domain/attendance.schema';
import { attendanceOdontogramRepository } from '@/modules/attendance/infra/attendance-odontogram.repository';

/**
 * GET /api/attendances/[id]/odontogram
 * Busca odontograma do atendimento
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

    // Buscar odontograma
    const odontogram = await attendanceOdontogramRepository.findByAttendanceId(attendanceId);

    return NextResponse.json({
      success: true,
      data: odontogram
    });

  } catch (error) {
    console.error('Erro ao buscar odontograma:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/attendances/[id]/odontogram
 * Atualiza odontograma do atendimento
 */
export async function PATCH(
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

    // Verificar permissão (apenas DENTIST)
    const userRole = session.user.role as UserRole;
    if (userRole !== UserRole.DENTIST) {
      return NextResponse.json(
        { success: false, error: 'Apenas dentistas podem atualizar odontograma' },
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
    const validation = updateOdontogramWithIdSchema.safeParse({
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
    const result = await updateAttendanceOdontogram({
      attendanceId,
      clinicId: session.user.clinicId,
      data: body
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao atualizar odontograma:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
