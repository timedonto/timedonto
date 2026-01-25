import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { addAttendanceProcedure } from '@/modules/attendance/application';
import { addProcedureWithIdSchema } from '@/modules/attendance/domain/attendance.schema';
import { attendanceProcedureRepository } from '@/modules/attendance/infra/attendance-procedure.repository';
import { prisma } from '@/lib/database';

/**
 * GET /api/attendances/[id]/procedures
 * Lista procedimentos do atendimento
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

    // Buscar procedimentos
    const procedures = await attendanceProcedureRepository.findByAttendanceId(attendanceId);

    return NextResponse.json({
      success: true,
      data: procedures
    });

  } catch (error) {
    console.error('Erro ao listar procedimentos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendances/[id]/procedures
 * Adiciona procedimento ao atendimento
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

    // Verificar permissão (apenas DENTIST, ADMIN, OWNER)
    const userRole = session.user.role as UserRole;
    if (userRole !== UserRole.DENTIST && userRole !== UserRole.ADMIN && userRole !== UserRole.OWNER) {
      return NextResponse.json(
        { success: false, error: 'Apenas dentistas, administradores ou proprietários podem adicionar tratamentos' },
        { status: 403 }
      );
    }

    const { id: attendanceId } = await params;

    // Buscar dentista do usuário logado (se for DENTIST)
    let dentistId: string | null = null;
    if (userRole === UserRole.DENTIST) {
      const dentist = await prisma.dentist.findFirst({
        where: {
          userId: session.user.id,
          clinicId: session.user.clinicId
        },
        select: {
          id: true
        }
      });
      if (dentist) {
        dentistId = dentist.id;
      } else {
        return NextResponse.json(
          { success: false, error: 'Dentista não encontrado para este usuário' },
          { status: 404 }
        );
      }
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
    const validation = addProcedureWithIdSchema.safeParse({
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

    // Buscar o atendimento para pegar o dentistId se necessário
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      select: { dentistId: true }
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: 'Atendimento não encontrado' },
        { status: 404 }
      );
    }

    // Para ADMIN/OWNER, usar o dentistaId do body se fornecido, senão usar o do atendimento
    if (userRole === UserRole.ADMIN || userRole === UserRole.OWNER) {
      dentistId = body.dentistId || attendance.dentistId;
    }

    if (!dentistId) {
      return NextResponse.json(
        { success: false, error: 'Dentista não identificado. Este atendimento precisa de um dentista vinculado.' },
        { status: 400 }
      );
    }

    // Chamar use case
    const result = await addAttendanceProcedure({
      attendanceId,
      clinicId: session.user.clinicId,
      dentistId,
      data: body
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao adicionar procedimento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attendances/[id]/procedures?procedureId=xxx
 * Remove um procedimento do atendimento
 */
export async function DELETE(
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

    // Verificar permissão (apenas DENTIST, ADMIN, OWNER)
    const userRole = session.user.role as UserRole;
    if (userRole !== UserRole.DENTIST && userRole !== UserRole.ADMIN && userRole !== UserRole.OWNER) {
      return NextResponse.json(
        { success: false, error: 'Apenas dentistas, administradores ou proprietários podem remover tratamentos' },
        { status: 403 }
      );
    }

    const { id: attendanceId } = await params;
    const { searchParams } = new URL(request.url);
    const procedureId = searchParams.get('procedureId');

    if (!procedureId) {
      return NextResponse.json(
        { success: false, error: 'ID do registro de tratamento é obrigatório' },
        { status: 400 }
      );
    }

    const { removeAttendanceProcedure } = await import('@/modules/attendance/application');

    // Chamar use case
    const result = await removeAttendanceProcedure({
      attendanceId,
      clinicId: session.user.clinicId,
      procedureId
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao remover procedimento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
