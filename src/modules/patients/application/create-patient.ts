import { patientRepository } from '../infra/patient.repository'
import { 
  createPatientSchema, 
  CreatePatientInput, 
  PatientOutput 
} from '../domain/patient.schema'

export interface CreatePatientParams {
  clinicId: string
  data: CreatePatientInput
}

export interface CreatePatientResult {
  success: boolean
  data?: PatientOutput
  error?: string
}

/**
 * Cria um novo paciente com validações de regras de negócio
 */
export async function createPatient(params: CreatePatientParams): Promise<CreatePatientResult> {
  const { clinicId, data } = params

  try {
    // Validar dados de entrada
    const validation = createPatientSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: CPF deve ser único na clínica (se informado)
    if (validatedData.cpf) {
      const cpfExists = await patientRepository.cpfExists(validatedData.cpf, clinicId)
      if (cpfExists) {
        return {
          success: false,
          error: 'Este CPF já está cadastrado na clínica'
        }
      }
    }

    // Regra de negócio: Email deve ser único na clínica (se informado)
    if (validatedData.email) {
      const emailExists = await patientRepository.emailExists(validatedData.email, clinicId)
      if (emailExists) {
        return {
          success: false,
          error: 'Este email já está cadastrado na clínica'
        }
      }
    }

    // Criar paciente
    const newPatient = await patientRepository.create(clinicId, validatedData)

    return {
      success: true,
      data: newPatient
    }

  } catch (error) {
    console.error('Erro ao criar paciente:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}