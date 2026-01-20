import { z } from 'zod'

export const dentistProcedureSchema = z.object({
    dentistId: z.string().cuid('ID do dentista deve ser um CUID válido'),
    procedureId: z.string().cuid('ID do procedimento deve ser um CUID válido'),
})

export const updateDentistProceduresSchema = z.object({
    procedureIds: z.array(z.string().cuid('Cada ID de procedimento deve ser um CUID válido')),
})

export type DentistProcedureInput = z.infer<typeof dentistProcedureSchema>
export type UpdateDentistProceduresInput = z.infer<typeof updateDentistProceduresSchema>

export interface DentistProcedureOutput {
    id: string
    dentistId: string
    procedureId: string
    createdAt: Date
    procedure: {
        id: string
        name: string
        specialtyId: string
        baseValue: number
    }
}
