import { createRecordSchema, type CreateRecordData } from '../domain/record.schema';
import { recordRepository } from '../infra/record.repository';

/**
 * Create a new record
 */
export async function createRecord(clinicId: string, data: CreateRecordData) {
  // Validate input data
  const validatedData = createRecordSchema.parse(data);

  // Create record
  return await recordRepository.create(clinicId, validatedData);
}