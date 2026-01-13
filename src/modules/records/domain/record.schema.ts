import { z } from 'zod';

// Schema for procedure objects
const procedureSchema = z.object({
  code: z.string().min(1, 'Código do procedimento é obrigatório'),
  description: z.string().min(1, 'Descrição do procedimento é obrigatória'),
  tooth: z.string().optional(),
});

// Schema for odontogram (tooth status mapping)
const odontogramSchema = z.record(z.string(), z.string());

// Schema for creating a new record
export const createRecordSchema = z.object({
  patientId: z.string().min(1, 'ID do paciente é obrigatório'),
  dentistId: z.string().min(1, 'ID do dentista é obrigatório'),
  appointmentId: z.string().optional(),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  procedures: z.array(procedureSchema).optional(),
  odontogram: odontogramSchema.optional(),
});

// Schema for updating an existing record
export const updateRecordSchema = z.object({
  patientId: z.string().optional(),
  dentistId: z.string().optional(),
  appointmentId: z.string().optional(),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').optional(),
  procedures: z.array(procedureSchema).optional(),
  odontogram: odontogramSchema.optional(),
});

// Schema for listing records with filters
export const listRecordsSchema = z.object({
  patientId: z.string().optional(),
  dentistId: z.string().optional(),
});

// Export types
export type CreateRecordData = z.infer<typeof createRecordSchema>;
export type UpdateRecordData = z.infer<typeof updateRecordSchema>;
export type ListRecordsFilters = z.infer<typeof listRecordsSchema>;
export type ProcedureData = z.infer<typeof procedureSchema>;
export type OdontogramData = z.infer<typeof odontogramSchema>;