import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import {
  listAttendances,
  checkInAttendance
} from '@/modules/attendance/application';
import {
  listAttendancesWithClinicSchema,
  createAttendanceWithClinicSchema
} from '@/modules/attendance/domain/attendance.schema';

/**
 * GET /api/attendances
 * Lista atendimentos com filtros opcionais
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

    // Ler query parameters
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const status = searchParams.get('status');
    if (status) {
      filters.status = status;
    }

    const patientId = searchParams.get('patientId');
    if (patientId) {
      filters.patientId = patientId;
    }

    const dentistId = searchParams.get('dentistId');
    if (dentistId) {
      filters.dentistId = dentistId;
    }

    const date = searchParams.get('date');
    if (date) {
      filters.date = date;
    }

    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }

    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = dateTo;
    }

    // Validar clinicId
    const clinicIdValidation = listAttendancesWithClinicSchema.safeParse({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    });

    if (!clinicIdValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Dados inválidos: ${clinicIdValidation.error.issues.map(i => i.message).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Chamar use case
    const result = await listAttendances({
      clinicId: session.user.clinicId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao listar atendimentos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendances
 * Cria um novo atendimento (check-in)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.clinicId || !session?.user?.id) {
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

    // Ler e validar body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body da requisição inválido' },
        { status: 400 }
      );
    }

    // Validar clinicId
    const clinicIdValidation = createAttendanceWithClinicSchema.safeParse({
      clinicId: session.user.clinicId,
      data: {
        ...body,
        createdByRole: userRole
      }
    });

    if (!clinicIdValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Dados inválidos: ${clinicIdValidation.error.issues.map(i => i.message).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Chamar use case
    const result = await checkInAttendance({
      clinicId: session.user.clinicId,
      data: {
        patientId: body.patientId,
        appointmentId: body.appointmentId,
        createdByRole: userRole
      },
      createdById: session.user.id,
      createdByRole: userRole
    });

    // Retornar resultado
    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error: any) {
    console.error('Erro ao criar atendimento:', error);
    
    // Garantir que sempre retornamos um JSON válido
    const errorMessage = error?.message || 'Erro interno do servidor';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
