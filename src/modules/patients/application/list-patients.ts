import { patientRepository } from '../infra/patient.repository'
import { 
  listPatientsSchema, 
  ListPatientsInput, 
  PatientOutput 
} from '../domain/patient.schema'

export interface ListPatientsParams {
  clinicId: string
  filters?: ListPatientsInput
}

export interface ListPatientsResult {
  success: true
  data: PatientOutput[]
}

/**
 * Lista pacientes de uma clínica com filtros opcionais
 */
export async function listPatients(params: ListPatientsParams): Promise<ListPatientsResult> {
  const { clinicId, filters } = params

  // Validar filtros se fornecidos
  if (filters) {
    const validation = listPatientsSchema.safeParse(filters)
    if (!validation.success) {
      throw new Error(`Filtros inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
    }
  }

  // Buscar pacientes
  const patients = await patientRepository.findMany(clinicId, filters)

  return {
    success: true,
    data: patients
  }
}