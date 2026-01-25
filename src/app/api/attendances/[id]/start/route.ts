import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { startAttendance } from '@/modules/attendance/application';
import { startAttendanceWithIdSchema } from '@/modules/attendance/domain/attendance.schema';
import { prisma } from '@/lib/database';

/**
 * POST /api/attendances/[id]/start
 * Dentista ou Proprietário inicia o atendimento
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
        { success: false, error: 'Apenas dentistas e proprietários podem iniciar atendimentos' },
        { status: 403 }
      );
    }

    const { id: attendanceId } = await params;

    // Ler body
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    let dentistId: string | undefined;

    if (userRole === UserRole.DENTIST) {
      // Se for dentista, buscar dentista do usuário
      const dentist = await prisma.dentist.findFirst({
        where: {
          userId: session.user.id,
          clinicId: session.user.clinicId
        }
      });

      if (!dentist) {
        return NextResponse.json(
          { success: false, error: 'Dentista não encontrado' },
          { status: 404 }
        );
      }

      dentistId = body.dentistId || dentist.id;
    } else if (userRole === UserRole.OWNER) {
      // Se for proprietário, usar o dentista do body ou buscar do atendimento
      if (body.dentistId) {
        dentistId = body.dentistId;
      } else {
        // Buscar atendimento para pegar o dentista associado
        const attendance = await prisma.attendance.findFirst({
          where: {
            id: attendanceId,
            clinicId: session.user.clinicId
          },
          select: {
            dentistId: true
          }
        });

        if (!attendance) {
          return NextResponse.json(
            { success: false, error: 'Atendimento não encontrado' },
            { status: 404 }
          );
        }

        if (!attendance.dentistId) {
          return NextResponse.json(
            { success: false, error: 'Atendimento não possui dentista associado. Informe o dentista.' },
            { status: 400 }
          );
        }

        dentistId = attendance.dentistId;
      }
    }

    // Validar
    const validation = startAttendanceWithIdSchema.safeParse({
      id: attendanceId,
      data: { dentistId: dentistId! }
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
    const result = await startAttendance({
      attendanceId,
      clinicId: session.user.clinicId,
      data: { dentistId: dentistId! },
      dentistUserId: userRole === UserRole.OWNER ? undefined : session.user.id,
      isOwner: userRole === UserRole.OWNER
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao iniciar atendimento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
