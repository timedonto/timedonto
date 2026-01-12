import { dentistRepository } from '../infra/dentist.repository'
import { 
  listDentistsSchema, 
  ListDentistsInput, 
  DentistOutput 
} from '../domain/dentist.schema'

export interface ListDentistsParams {
  clinicId: string
  filters?: ListDentistsInput
}

export interface ListDentistsResult {
  success: true
  data: DentistOutput[]
}

/**
 * Lista dentistas de uma clínica com filtros opcionais
 */
export async function listDentists(params: ListDentistsParams): Promise<ListDentistsResult> {
  const { clinicId, filters } = params

  // Validar filtros se fornecidos
  if (filters) {
    const validation = listDentistsSchema.safeParse(filters)
    if (!validation.success) {
      throw new Error(`Filtros inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
    }
  }

  // Buscar dentistas
  const dentists = await dentistRepository.findMany(clinicId, filters)

  return {
    success: true,
    data: dentists
  }
}