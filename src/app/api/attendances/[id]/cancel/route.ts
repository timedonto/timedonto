import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { cancelAttendance } from '@/modules/attendance/application';
import { cancelAttendanceWithIdSchema } from '@/modules/attendance/domain/attendance.schema';

/**
 * POST /api/attendances/[id]/cancel
 * Cancela o atendimento
 */
export async function POST(
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

    // Verificar permissão (OWNER, ADMIN, RECEPTIONIST ou DENTIST)
    const userRole = session.user.role as UserRole;
    if (
      userRole !== UserRole.OWNER &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.RECEPTIONIST &&
      userRole !== UserRole.DENTIST
    ) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const { id: attendanceId } = await params;

    // Ler body (opcional)
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Validar
    const validation = cancelAttendanceWithIdSchema.safeParse({
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
    const result = await cancelAttendance({
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
    console.error('Erro ao cancelar atendimento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
