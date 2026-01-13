// Use cases
export { listRecords } from './list-records';
export { createRecord } from './create-record';
export { getRecord } from './get-record';

// Types and schemas
export type {
  CreateRecordData,
  UpdateRecordData,
  ListRecordsFilters,
  ProcedureData,
  OdontogramData,
} from '../domain/record.schema';

export {
  createRecordSchema,
  updateRecordSchema,
  listRecordsSchema,
} from '../domain/record.schema';