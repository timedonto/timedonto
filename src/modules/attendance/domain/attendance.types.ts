import { AttendanceStatus, ClinicalDocumentType } from '@prisma/client';

// =====================================================================
// TYPE EXPORTS
// =====================================================================

export type { AttendanceStatus, ClinicalDocumentType };

// =====================================================================
// ATTENDANCE TYPES
// =====================================================================

export interface AttendanceFilters {
  status?: AttendanceStatus;
  patientId?: string;
  dentistId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface WaitingRoomFilters {
  dentistId?: string;
}

// =====================================================================
// CID TYPES
// =====================================================================

export interface CIDData {
  cidCode: string;
  description: string;
  observation?: string;
}

// =====================================================================
// PROCEDURE TYPES
// =====================================================================

export interface ProcedureData {
  procedureCode: string;
  description: string;
  tooth?: string;
  surface?: string;
  quantity: number;
}

// =====================================================================
// ODONTOGRAM TYPES
// =====================================================================

export type OdontogramData = Record<string, string>;

// =====================================================================
// DOCUMENT TYPES
// =====================================================================

export interface DocumentPayload {
  [key: string]: any;
}

export interface AtestadoPayload extends DocumentPayload {
  days?: number;
  description?: string;
}

export interface PrescricaoPayload extends DocumentPayload {
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
  }>;
  instructions?: string;
}

export interface ExamePayload extends DocumentPayload {
  examType?: string;
  description?: string;
  instructions?: string;
}

export interface EncaminhamentoPayload extends DocumentPayload {
  specialty?: string;
  description?: string;
  urgency?: string;
}
