import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAttendance } from '@/modules/attendance/application';
import { getAttendanceSchema } from '@/modules/attendance/domain/attendance.schema';
import { attendanceRepository } from '@/modules/attendance/infra/attendance.repository';
import { AttendanceStatus } from '@prisma/client';

/**
 * GET /api/attendances/[id]
 * Busca um atendimento por ID
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

    // Validar ID
    const idValidation = getAttendanceSchema.safeParse({ id: attendanceId });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `ID inválido: ${idValidation.error.issues.map(i => i.message).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Chamar use case
    const result = await getAttendance({
      attendanceId,
      clinicId: session.user.clinicId
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }

  } catch (error) {
    console.error('Erro ao buscar atendimento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/attendances/[id]
 * Atualiza um atendimento
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

    // Validar ID
    const idValidation = getAttendanceSchema.safeParse({ id: attendanceId });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `ID inválido: ${idValidation.error.issues.map(i => i.message).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Atualizar apenas campos permitidos
    const updateData: any = {};
    if (body.status && Object.values(AttendanceStatus).includes(body.status)) {
      updateData.status = body.status;
    }

    // Chamar repositório
    const updatedAttendance = await attendanceRepository.update(
      attendanceId,
      session.user.clinicId,
      updateData
    );

    if (updatedAttendance) {
      return NextResponse.json({
        success: true,
        data: updatedAttendance
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Atendimento não encontrado' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Erro ao atualizar atendimento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
