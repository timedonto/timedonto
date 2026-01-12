import { patientRepository } from '../infra/patient.repository'
import { PatientOutput } from '../domain/patient.schema'

export interface GetPatientParams {
  id: string
  clinicId: string
}

export interface GetPatientResult {
  success: boolean
  data?: PatientOutput | null
  error?: string
}

/**
 * Busca um paciente por ID validando que pertence à clínica
 */
export async function getPatient(params: GetPatientParams): Promise<GetPatientResult> {
  const { id, clinicId } = params

  try {
    // Buscar paciente
    const patient = await patientRepository.findById(id, clinicId)

    return {
      success: true,
      data: patient
    }

  } catch (error) {
    console.error('Erro ao buscar paciente:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}