import { prisma } from '@/lib/database'
import { treatmentPlanRepository } from '../infra/treatment-plan.repository'
import { patientRepository } from '../../patients/infra/patient.repository'
import { dentistRepository } from '../../dentists/infra/dentist.repository'
import { 
  createTreatmentPlanSchema, 
  CreateTreatmentPlanInput, 
  TreatmentPlanOutput 
} from '../domain/treatment-plan.schema'

export interface CreateTreatmentPlanParams {
  clinicId: string
  data: CreateTreatmentPlanInput
}

export interface CreateTreatmentPlanResult {
  success: boolean
  data?: TreatmentPlanOutput
  error?: string
}

/**
 * Cria um novo orçamento com validações de regras de negócio
 */
export async function createTreatmentPlan(params: CreateTreatmentPlanParams): Promise<CreateTreatmentPlanResult> {
  const { clinicId, data } = params

  try {
    // Validar dados de entrada
    console.log('Dados recebidos para criar orçamento:', JSON.stringify(data, null, 2))
    const validation = createTreatmentPlanSchema.safeParse(data)
    if (!validation.success) {
      console.error('Erro de validação:', validation.error.issues)
      return {
        success: false,
        error: `Dados inválidos: ${validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`
      }
    }

    const validatedData = validation.data

    // Regra de negócio: Paciente deve existir e pertencer à clínica
    const patient = await patientRepository.findById(validatedData.patientId, clinicId)
    if (!patient) {
      return {
        success: false,
        error: 'Paciente não encontrado na clínica'
      }
    }

    if (!patient.isActive) {
      return {
        success: false,
        error: 'Paciente está inativo'
      }
    }

    // Regra de negócio: Dentista deve existir e pertencer à clínica
    const dentist = await dentistRepository.findById(validatedData.dentistId, clinicId)
    if (!dentist) {
      return {
        success: false,
        error: 'Dentista não encontrado na clínica'
      }
    }

    if (!dentist.user.isActive) {
      return {
        success: false,
        error: 'Dentista está inativo'
      }
    }

    // Regra de negócio: Validar que procedimentos pertencem ao dentista e valores estão corretos
    const itemsWithProcedureId = validatedData.items.filter(item => item.procedureId)
    
    if (itemsWithProcedureId.length > 0) {
      // Buscar procedimentos vinculados ao dentista
      const dentistProcedures = await prisma.dentistProcedure.findMany({
        where: {
          dentistId: validatedData.dentistId,
          dentist: {
            clinicId
          },
          procedure: {
            isActive: true,
            clinicId
          }
        },
        include: {
          procedure: {
            select: {
              id: true,
              baseValue: true,
              name: true
            }
          }
        }
      })

      const allowedProcedureIds = new Set(dentistProcedures.map(dp => dp.procedure.id))
      const procedureMap = new Map(
        dentistProcedures.map(dp => [dp.procedure.id, dp.procedure])
      )

      // Validar cada item com procedureId
      for (const item of itemsWithProcedureId) {
        if (!item.procedureId) continue

        // Verificar se procedimento pertence ao dentista
        if (!allowedProcedureIds.has(item.procedureId)) {
          const procedure = procedureMap.get(item.procedureId)
          const procedureName = procedure?.name || item.procedureId
          return {
            success: false,
            error: `Procedimento "${procedureName}" não está vinculado ao dentista selecionado`
          }
        }

        // Verificar se valor corresponde ao valor do cadastro
        const procedure = procedureMap.get(item.procedureId)!
        const expectedValue = Number(procedure.baseValue)
        
        // Permitir pequena diferença devido a arredondamentos (0.01)
        if (Math.abs(item.value - expectedValue) > 0.01) {
          return {
            success: false,
            error: `Valor do procedimento "${procedure.name}" (R$ ${item.value.toFixed(2)}) não corresponde ao valor cadastrado (R$ ${expectedValue.toFixed(2)})`
          }
        }
      }
    }

    // Validar desconto não excede total
    const totalAmount = validatedData.items.reduce((sum, item) => sum + (item.value * item.quantity), 0)
    if (validatedData.discountType === 'FIXED' && validatedData.discountValue) {
      if (validatedData.discountValue > totalAmount) {
        return {
          success: false,
          error: 'Desconto fixo não pode exceder o valor total do orçamento'
        }
      }
    }

    // Criar orçamento
    console.log('Criando orçamento com dados validados:', JSON.stringify(validatedData, null, 2))
    const newTreatmentPlan = await treatmentPlanRepository.create(clinicId, validatedData)
    console.log('Orçamento criado com sucesso:', newTreatmentPlan.id)

    return {
      success: true,
      data: newTreatmentPlan
    }

  } catch (error) {
    console.error('Erro ao criar orçamento:', error)
    
    // Se for um erro conhecido do Prisma, retornar mensagem mais específica
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
      
      // Verificar se é erro de campo não encontrado
      if (error.message.includes('Unknown arg') || error.message.includes('does not exist') || error.message.includes('Unknown column')) {
        return {
          success: false,
          error: 'Erro: Campos de desconto não estão disponíveis no banco de dados. Execute a migration primeiro.'
        }
      }
      
      // Verificar se é erro de constraint
      if (error.message.includes('violates foreign key') || error.message.includes('Foreign key constraint')) {
        return {
          success: false,
          error: 'Erro: Procedimento ou relacionamento inválido. Verifique se o procedimento está vinculado ao dentista.'
        }
      }
      
      return {
        success: false,
        error: error.message || 'Erro interno do servidor'
      }
    }
    
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}