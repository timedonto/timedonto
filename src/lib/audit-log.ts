import { prisma } from '@/lib/database';

interface CreateAuditLogData {
  clinicId: string;
  userId: string;
  action: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: CreateAuditLogData) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        clinicId: data.clinicId,
        userId: data.userId,
        action: data.action,
        targetId: data.targetId,
        targetType: data.targetType,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to avoid breaking the main operation
    // Audit logging should be non-blocking
    return null;
  }
}

// Predefined audit actions for records
export const AUDIT_ACTIONS = {
  ACCESS_RECORD: 'ACCESS_RECORD',
  CREATE_RECORD: 'CREATE_RECORD',
  UPDATE_RECORD: 'UPDATE_RECORD',
  DELETE_RECORD: 'DELETE_RECORD',
} as const;

// Predefined target types
export const TARGET_TYPES = {
  RECORD: 'Record',
  PATIENT: 'Patient',
  APPOINTMENT: 'Appointment',
  USER: 'User',
} as const;