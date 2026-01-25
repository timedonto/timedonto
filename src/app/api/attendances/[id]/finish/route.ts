import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { finishAttendance } from '@/modules/attendance/application';

/**
 * POST /api/attendances/[id]/finish
 * Dentista ou Proprietário finaliza o atendimento
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

    // Verificar permissão (DENTIST ou OWNER)
    const userRole = session.user.role as UserRole;
    if (userRole !== UserRole.DENTIST && userRole !== UserRole.OWNER) {
      return NextResponse.json(
        { success: false, error: 'Apenas dentistas e proprietários podem finalizar atendimentos' },
        { status: 403 }
      );
    }

    const { id: attendanceId } = await params;

    // Chamar use case
    const result = await finishAttendance({
      attendanceId,
      clinicId: session.user.clinicId
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao finalizar atendimento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
