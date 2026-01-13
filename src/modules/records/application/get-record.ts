import { recordRepository } from '../infra/record.repository';

/**
 * Get a record by ID
 */
export async function getRecord(id: string, clinicId: string) {
  const record = await recordRepository.findById(id, clinicId);

  if (!record) {
    throw new Error('Prontuário não encontrado');
  }

  return record;
}