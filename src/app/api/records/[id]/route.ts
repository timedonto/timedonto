import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRecord } from '@/modules/records/application';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/audit-log';
import { UserRole } from '@prisma/client';

/**
 * GET /api/records/[id]
 * Get a specific record by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Check permissions - block RECEPTIONIST
    if (session.user.role === UserRole.RECEPTIONIST) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para acessar prontuários' },
        { status: 403 }
      );
    }

    const { id } = params;
    const clinicId = session.user.clinicId;

    // Get record by ID
    const record = await getRecord(id, clinicId);

    // Log audit trail for record access
    await createAuditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: AUDIT_ACTIONS.ACCESS_RECORD,
      targetId: id,
      targetType: TARGET_TYPES.RECORD,
      metadata: {
        patientId: record.patientId,
        dentistId: record.dentistId,
        userRole: session.user.role,
        accessedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Error getting record:', error);
    
    // Handle "not found" errors
    if (error instanceof Error && error.message === 'Prontuário não encontrado') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}