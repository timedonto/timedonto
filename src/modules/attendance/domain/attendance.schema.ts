import { z } from 'zod';
import { AttendanceStatus, ClinicalDocumentType, UserRole } from '@prisma/client';

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const createAttendanceSchema = z.object({
  patientId: z.string().cuid('ID do paciente deve ser um CUID válido'),
  appointmentId: z.string().cuid('ID do agendamento deve ser um CUID válido').optional(),
  dentistId: z.string().cuid('ID do dentista deve ser um CUID válido').optional(),
  createdByRole: z.nativeEnum(UserRole, {
    message: 'Role deve ser OWNER, ADMIN, RECEPTIONIST ou DENTIST'
  }).refine(
    (role) =>
      role === UserRole.OWNER ||
      role === UserRole.ADMIN ||
      role === UserRole.RECEPTIONIST ||
      role === UserRole.DENTIST,
    { message: 'Apenas OWNER, ADMIN, RECEPTIONIST ou DENTIST podem criar atendimento' }
  ),
});

export const startAttendanceSchema = z.object({
  dentistId: z.string().cuid('ID do dentista deve ser um CUID válido'),
});

export const finishAttendanceSchema = z.object({});

export const cancelAttendanceSchema = z.object({
  reason: z.string().optional(),
});

export const listAttendancesSchema = z.object({
  status: z.nativeEnum(AttendanceStatus).optional(),
  patientId: z.string().cuid('ID do paciente deve ser um CUID válido').optional(),
  dentistId: z.string().cuid('ID do dentista deve ser um CUID válido').optional(),
  date: z.string().refine(
    (val) => {
      // Aceita tanto ISO datetime completo quanto formato YYYY-MM-DD
      const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/;
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return isoDateTimeRegex.test(val) || isoDateRegex.test(val);
    },
    { message: 'Data deve ser uma data válida (YYYY-MM-DD ou ISO datetime)' }
  ).optional(),
  dateFrom: z.string().refine(
    (val) => {
      const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/;
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return isoDateTimeRegex.test(val) || isoDateRegex.test(val);
    },
    { message: 'Data inicial deve ser uma data válida (YYYY-MM-DD ou ISO datetime)' }
  ).optional(),
  dateTo: z.string().refine(
    (val) => {
      const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/;
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return isoDateTimeRegex.test(val) || isoDateRegex.test(val);
    },
    { message: 'Data final deve ser uma data válida (YYYY-MM-DD ou ISO datetime)' }
  ).optional(),
});

export const addCIDSchema = z.object({
  cidCode: z.string()
    .min(1, 'Código CID é obrigatório')
    .regex(/^[A-Z]\d{2}(\.\d)?$/, 'Código CID deve ter formato válido (ex: K02.0, Z01.2)'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  observation: z.string().optional(),
});

export const addProcedureSchema = z.object({
  procedureId: z.string().cuid('ID do procedimento deve ser válido'),
  tooth: z.string().regex(/^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$/, 'Dente deve estar entre 11-18, 21-28, 31-38, 41-48'),
  faces: z.array(z.enum(['O', 'M', 'D', 'V', 'L'])).min(1, 'Selecione pelo menos uma face'),
  clinicalStatus: z.enum(['SAUDAVEL', 'CARIE', 'RESTAURADO', 'AUSENTE', 'EM_TRATAMENTO', 'EXTRACAO'], {
    message: 'Status clínico inválido'
  }),
  observations: z.string().optional(),
  // Campos opcionais para compatibilidade
  procedureCode: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().int('Quantidade deve ser um número inteiro').min(1, 'Quantidade deve ser no mínimo 1').default(1).optional(),
  surface: z.string().optional(),
});

export const updateOdontogramSchema = z.object({
  data: z.record(z.string(), z.string(), {
    message: 'Odontograma deve ser um objeto válido'
  }),
});

export const createDocumentSchema = z.object({
  type: z.nativeEnum(ClinicalDocumentType, {
    message: 'Tipo de documento inválido'
  }),
  payload: z.record(z.string(), z.any()),
});

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type CreateAttendanceData = z.infer<typeof createAttendanceSchema>;
export type StartAttendanceData = z.infer<typeof startAttendanceSchema>;
export type FinishAttendanceData = z.infer<typeof finishAttendanceSchema>;
export type CancelAttendanceData = z.infer<typeof cancelAttendanceSchema>;
export type ListAttendancesFilters = z.infer<typeof listAttendancesSchema>;
export type AddCIDData = z.infer<typeof addCIDSchema>;
export type AddProcedureData = z.infer<typeof addProcedureSchema>;
export type UpdateOdontogramData = z.infer<typeof updateOdontogramSchema>;
export type CreateDocumentData = z.infer<typeof createDocumentSchema>;

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface AttendanceOutput {
  id: string;
  clinicId: string;
  appointmentId: string | null;
  patientId: string;
  dentistId: string | null;
  status: AttendanceStatus;
  arrivalAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdByRole: UserRole;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  dentist: {
    id: string;
    cro: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  appointment: {
    id: string;
    date: Date;
    status: string;
  } | null;
  cids: Array<{
    id: string;
    cidCode: string;
    description: string;
    observation: string | null;
    createdByDentistId: string;
    category?: string | null;
  }>;
  procedures: Array<{
    id: string;
    procedureId: string | null;
    procedureCode: string | null;
    description: string;
    tooth: string | null;
    surface: string | null;
    faces: string[];
    quantity: number;
    clinicalStatus: string | null;
    price: number | null;
    dentistId: string | null;
    observations: string | null;
    createdAt: Date;
    updatedAt: Date;
    procedure?: {
      id: string;
      name: string;
      baseValue: number;
      description: string | null;
    } | null;
    dentist?: {
      id: string;
      cro: string;
      user: {
        id: string;
        name: string;
      };
    } | null;
  }>;
  odontogram: {
    data: Record<string, string>;
  } | null;
  documents: Array<{
    id: string;
    type: ClinicalDocumentType;
    payload: Record<string, any>;
    generatedBy: string;
    generatedAt: Date;
  }>;
}

// =====================================================================
// HELPER SCHEMAS
// =====================================================================

export const attendanceIdSchema = z.object({
  id: z.string().cuid('ID deve ser um CUID válido')
});

export const clinicIdSchema = z.object({
  clinicId: z.string().cuid('ID da clínica deve ser um CUID válido')
});

// =====================================================================
// COMPOSITE SCHEMAS
// =====================================================================

export const getAttendanceSchema = attendanceIdSchema;

export const createAttendanceWithClinicSchema = clinicIdSchema.merge(
  z.object({
    data: createAttendanceSchema
  })
);

export const listAttendancesWithClinicSchema = clinicIdSchema.merge(
  z.object({
    filters: listAttendancesSchema.optional()
  })
);

export const startAttendanceWithIdSchema = attendanceIdSchema.merge(
  z.object({
    data: startAttendanceSchema
  })
);

export const finishAttendanceWithIdSchema = attendanceIdSchema;

export const cancelAttendanceWithIdSchema = attendanceIdSchema.merge(
  z.object({
    data: cancelAttendanceSchema.optional()
  })
);

export const addCIDWithIdSchema = attendanceIdSchema.merge(
  z.object({
    data: addCIDSchema
  })
);

export const addProcedureWithIdSchema = attendanceIdSchema.merge(
  z.object({
    data: addProcedureSchema
  })
);

export const updateOdontogramWithIdSchema = attendanceIdSchema.merge(
  z.object({
    data: updateOdontogramSchema
  })
);

export const createDocumentWithIdSchema = attendanceIdSchema.merge(
  z.object({
    data: createDocumentSchema
  })
);

// =====================================================================
// EXPORTED TYPES FOR COMPOSITE SCHEMAS
// =====================================================================

export type GetAttendanceInput = z.infer<typeof getAttendanceSchema>;
export type CreateAttendanceWithClinicInput = z.infer<typeof createAttendanceWithClinicSchema>;
export type ListAttendancesWithClinicInput = z.infer<typeof listAttendancesWithClinicSchema>;
export type StartAttendanceWithIdInput = z.infer<typeof startAttendanceWithIdSchema>;
export type FinishAttendanceWithIdInput = z.infer<typeof finishAttendanceWithIdSchema>;
export type CancelAttendanceWithIdInput = z.infer<typeof cancelAttendanceWithIdSchema>;
export type AddCIDWithIdInput = z.infer<typeof addCIDWithIdSchema>;
export type AddProcedureWithIdInput = z.infer<typeof addProcedureWithIdSchema>;
export type UpdateOdontogramWithIdInput = z.infer<typeof updateOdontogramWithIdSchema>;
export type CreateDocumentWithIdInput = z.infer<typeof createDocumentWithIdSchema>;

// =====================================================================
// STATUS CONSTANTS
// =====================================================================

export const ATTENDANCE_STATUS_LABELS = {
  [AttendanceStatus.CHECKED_IN]: 'Check-in',
  [AttendanceStatus.IN_PROGRESS]: 'Em Atendimento',
  [AttendanceStatus.DONE]: 'Finalizado',
  [AttendanceStatus.CANCELED]: 'Cancelado',
  [AttendanceStatus.NO_SHOW]: 'Não Compareceu',
} as const;

export const ACTIVE_ATTENDANCE_STATUSES = [
  AttendanceStatus.CHECKED_IN,
  AttendanceStatus.IN_PROGRESS,
] as const;

export const COMPLETED_ATTENDANCE_STATUSES = [
  AttendanceStatus.DONE,
  AttendanceStatus.CANCELED,
  AttendanceStatus.NO_SHOW,
] as const;
