import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { addAttendanceCID } from '@/modules/attendance/application';
import { addCIDWithIdSchema } from '@/modules/attendance/domain/attendance.schema';
import { attendanceCIDRepository } from '@/modules/attendance/infra/attendance-cid.repository';
import { prisma } from '@/lib/database';

/**
 * GET /api/attendances/[id]/cids
 * Lista CIDs do atendimento
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

    // Buscar CIDs
    const cids = await attendanceCIDRepository.findByAttendanceId(attendanceId);

    return NextResponse.json({
      success: true,
      data: cids
    });

  } catch (error) {
    console.error('Erro ao listar CIDs:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendances/[id]/cids
 * Adiciona CID ao atendimento
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
        { success: false, error: 'Apenas dentistas e proprietários podem adicionar CIDs' },
        { status: 403 }
      );
    }

    const { id: attendanceId } = await params;

    // Buscar atendimento para obter o dentista associado
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        clinicId: session.user.clinicId
      },
      include: {
        dentist: true
      }
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: 'Atendimento não encontrado' },
        { status: 404 }
      );
    }

    let dentistId: string;

    if (userRole === UserRole.OWNER) {
      // Se for OWNER, usar o dentista do atendimento
      if (!attendance.dentistId) {
        return NextResponse.json(
          { success: false, error: 'Atendimento não possui dentista associado' },
          { status: 400 }
        );
      }
      dentistId = attendance.dentistId;
    } else {
      // Se for DENTIST, buscar dentista do usuário e validar
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

      // Validar que o dentista do usuário é o mesmo do atendimento (ou permitir se não houver dentista no atendimento)
      if (attendance.dentistId && attendance.dentistId !== dentist.id) {
        return NextResponse.json(
          { success: false, error: 'Você não tem permissão para adicionar CIDs neste atendimento' },
          { status: 403 }
        );
      }

      dentistId = dentist.id;
    }

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
    const validation = addCIDWithIdSchema.safeParse({
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
    const result = await addAttendanceCID({
      attendanceId,
      clinicId: session.user.clinicId,
      data: body,
      dentistId
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao adicionar CID:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attendances/[id]/cids?cidId=xxx
 * Remove um CID do atendimento
 */
export async function DELETE(
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
        { success: false, error: 'Apenas dentistas e proprietários podem remover CIDs' },
        { status: 403 }
      );
    }

    const { id: attendanceId } = await params;

    // Verificar se o atendimento existe e pertence à clínica
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        clinicId: session.user.clinicId
      }
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: 'Atendimento não encontrado' },
        { status: 404 }
      );
    }

    // Obter ID do CID a ser removido
    const { searchParams } = new URL(request.url);
    const cidId = searchParams.get('cidId');

    if (!cidId) {
      return NextResponse.json(
        { success: false, error: 'ID do CID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o CID existe e pertence ao atendimento
    const cid = await prisma.attendanceCID.findFirst({
      where: {
        id: cidId,
        attendanceId
      }
    });

    if (!cid) {
      return NextResponse.json(
        { success: false, error: 'CID não encontrado' },
        { status: 404 }
      );
    }

    // Remover CID
    await attendanceCIDRepository.delete(cidId, attendanceId);

    // Buscar CIDs atualizados
    const updatedCIDs = await attendanceCIDRepository.findByAttendanceId(attendanceId);

    return NextResponse.json({
      success: true,
      data: {
        cids: updatedCIDs
      }
    });

  } catch (error) {
    console.error('Erro ao remover CID:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
