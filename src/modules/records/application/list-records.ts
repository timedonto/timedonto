import { listRecordsSchema, type ListRecordsFilters } from '../domain/record.schema';
import { recordRepository } from '../infra/record.repository';

/**
 * List records with optional filters
 */
export async function listRecords(clinicId: string, filters?: ListRecordsFilters) {
  // Validate filters if provided
  if (filters) {
    const validatedFilters = listRecordsSchema.parse(filters);
    return await recordRepository.findMany(clinicId, validatedFilters);
  }

  return await recordRepository.findMany(clinicId);
}