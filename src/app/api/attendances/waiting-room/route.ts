import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/roles';
import { auth } from '@/lib/auth';
import { listWaitingRoom } from '@/modules/attendance/application';

/**
 * GET /api/attendances/waiting-room
 * Lista fila de espera (CHECKED_IN)
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

    // Ler query parameters
    const { searchParams } = new URL(request.url);
    const dentistId = searchParams.get('dentistId') || undefined;

    // Chamar use case
    const result = await listWaitingRoom({
      clinicId: session.user.clinicId,
      dentistId
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      console.error('Erro ao listar fila de espera:', result.error);
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao listar fila de espera:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
