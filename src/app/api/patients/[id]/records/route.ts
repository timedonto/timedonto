import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listRecords, createRecord } from '@/modules/records/application';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/audit-log';
import { UserRole } from '@prisma/client';

/**
 * GET /api/patients/[id]/records
 * List records for a specific patient
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== DEBUG RECORDS API ===")
    
    const session = await auth()
    console.log("Session:", session?.user)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 })
    }
    
    const { id } = await params
    console.log("Patient ID:", id)
    console.log("Clinic ID:", session.user.clinicId)
    
    const records = await listRecords(session.user.clinicId, { patientId: id })
    console.log("Records encontrados:", records.length)
    
    return NextResponse.json({ success: true, data: records })
  } catch (error) {
    console.error("=== ERRO NA API RECORDS ===", error)
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 })
  }
}

/**
 * POST /api/patients/[id]/records
 * Create a new record for a specific patient
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📝 [POST /api/patients/[id]/records] Starting request...');
    
    // Check authentication
    const session = await auth();
    console.log('🔐 Session check:', { hasSession: !!session, hasUser: !!session?.user });
    
    if (!session?.user) {
      console.log('❌ No session or user found');
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Check permissions - block RECEPTIONIST
    console.log('👤 User role:', session.user.role);
    if (session.user.role === UserRole.RECEPTIONIST) {
      console.log('❌ RECEPTIONIST role blocked');
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para acessar prontuários' },
        { status: 403 }
      );
    }

    // Extract params (await required in App Router)
    const { id } = await params;
    const clinicId = session.user.clinicId;
    const body = await request.json();
    
    console.log('📋 Request params:', { patientId: id, clinicId });
    console.log('📄 Request body keys:', Object.keys(body));

    // Add patientId from params to the request data
    const recordData = {
      ...body,
      patientId: id,
    };

    console.log('💾 Creating record with data:', {
      patientId: recordData.patientId,
      dentistId: recordData.dentistId,
      hasDescription: !!recordData.description,
      hasProcedures: !!recordData.procedures,
      hasOdontogram: !!recordData.odontogram,
    });

    // Create record
    const record = await createRecord(clinicId, recordData);
    console.log('✅ Record created with ID:', record.id);

    // Log audit trail for record creation
    await createAuditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: AUDIT_ACTIONS.CREATE_RECORD,
      targetId: record.id,
      targetType: TARGET_TYPES.RECORD,
      metadata: {
        patientId: id,
        dentistId: recordData.dentistId,
        hasOdontogram: !!recordData.odontogram,
        proceduresCount: recordData.procedures?.length || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('❌ [POST /api/patients/[id]/records] Error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}