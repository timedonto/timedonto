import { patientRepository } from '../infra/patient.repository'
import { 
  updatePatientSchema, 
  UpdatePatientInput, 
  PatientOutput 
} from '../domain/patient.schema'

export interface UpdatePatientParams {
  id: string
  clinicId: string
  data: UpdatePatientInput
}

export interface UpdatePatientResult {
  success: boolean
  data?: PatientOutput
  error?: string
}

/**
 * Atualiza um paciente com validações de regras de negócio
 */
export async function updatePatient(params: UpdatePatientParams): Promise<UpdatePatientResult> {
  const { id, clinicId, data } = params

  try {
    // Validar dados de entrada
    const validation = updatePatientSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Verificar se paciente existe e pertence à clínica
    const existingPatient = await patientRepository.findById(id, clinicId)
    if (!existingPatient) {
      return {
        success: false,
        error: 'Paciente não encontrado'
      }
    }

    // Regra de negócio: CPF deve ser único na clínica (se alterado)
    if (validatedData.cpf && validatedData.cpf !== existingPatient.cpf) {
      const cpfExists = await patientRepository.cpfExists(validatedData.cpf, clinicId, id)
      if (cpfExists) {
        return {
          success: false,
          error: 'Este CPF já está cadastrado na clínica'
        }
      }
    }

    // Regra de negócio: Email deve ser único na clínica (se alterado)
    if (validatedData.email && validatedData.email !== existingPatient.email) {
      const emailExists = await patientRepository.emailExists(validatedData.email, clinicId, id)
      if (emailExists) {
        return {
          success: false,
          error: 'Este email já está cadastrado na clínica'
        }
      }
    }

    // Atualizar paciente
    const updatedPatient = await patientRepository.update(id, clinicId, validatedData)

    if (!updatedPatient) {
      return {
        success: false,
        error: 'Erro ao atualizar paciente'
      }
    }

    return {
      success: true,
      data: updatedPatient
    }

  } catch (error) {
    console.error('Erro ao atualizar paciente:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}