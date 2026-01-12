import { appointmentRepository } from '../infra/appointment.repository'
import { 
  listAppointmentsSchema, 
  ListAppointmentsInput, 
  AppointmentOutput 
} from '../domain/appointment.schema'

export interface ListAppointmentsParams {
  clinicId: string
  filters?: ListAppointmentsInput
}

export interface ListAppointmentsResult {
  success: true
  data: AppointmentOutput[]
}

/**
 * Lista agendamentos de uma clínica com filtros opcionais
 */
export async function listAppointments(params: ListAppointmentsParams): Promise<ListAppointmentsResult> {
  const { clinicId, filters } = params

  // Validar filtros se fornecidos
  if (filters) {
    const validation = listAppointmentsSchema.safeParse(filters)
    if (!validation.success) {
      throw new Error(`Filtros inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
    }
  }

  // Buscar agendamentos
  const appointments = await appointmentRepository.findMany(clinicId, filters)

  return {
    success: true,
    data: appointments
  }
}