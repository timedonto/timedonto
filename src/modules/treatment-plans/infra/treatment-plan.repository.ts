import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/database'
import {
  CreateTreatmentPlanInput,
  UpdateTreatmentPlanInput,
  ListTreatmentPlansInput,
  TreatmentPlanOutput,
  TreatmentItemInput,
  TreatmentItemOutput,
  calculateTotalAmount,
  calculateFinalAmount
} from '../domain/treatment-plan.schema'

export class TreatmentPlanRepository {
  /**
   * Lista orçamentos de uma clínica com filtros opcionais
   */
  async findMany(clinicId: string, filters?: ListTreatmentPlansInput): Promise<TreatmentPlanOutput[]> {
    const where: any = {
      clinicId,
    }

    // Aplicar filtros
    if (filters?.patientId) {
      where.patientId = filters.patientId
    }

    if (filters?.dentistId) {
      where.dentistId = filters.dentistId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where,
      select: {
        id: true,
        clinicId: true,
        patientId: true,
        dentistId: true,
        status: true,
        totalAmount: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        items: {
          select: {
            id: true,
            planId: true,
            procedureId: true,
            description: true,
            tooth: true,
            value: true,
            quantity: true,
          },
          orderBy: {
            description: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return treatmentPlans.map(plan => {
      const totalAmount = Number(plan.totalAmount)
      // Calcular finalAmount sempre (sem desconto por enquanto, já que as colunas podem não existir)
      const finalAmount = calculateFinalAmount(
        totalAmount,
        null, // discountType
        null  // discountValue
      )

      return {
        id: plan.id,
        clinicId: plan.clinicId,
        patientId: plan.patientId,
        dentistId: plan.dentistId,
        status: plan.status as any,
        totalAmount,
        discountType: null,
        discountValue: null,
        finalAmount,
        notes: plan.notes,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        items: plan.items.map(item => ({
          id: item.id,
          planId: item.planId,
          procedureId: item.procedureId,
          description: item.description,
          tooth: item.tooth,
          value: Number(item.value),
          quantity: item.quantity,
        })),
        patient: plan.patient
          ? {
              id: plan.patient.id,
              name: plan.patient.name,
              email: plan.patient.email,
              phone: plan.patient.phone,
            }
          : null,
        dentist: plan.dentist
          ? {
              id: plan.dentist.id,
              cro: plan.dentist.cro,
              specialty: plan.dentist.specialty,
              user: {
                id: plan.dentist.user.id,
                name: plan.dentist.user.name,
                email: plan.dentist.user.email,
              },
            }
          : null,
      }
    })
  }

  /**
   * Busca orçamento por ID validando que pertence à clínica
   */
  async findById(id: string, clinicId: string): Promise<TreatmentPlanOutput | null> {
    const treatmentPlan = await prisma.treatmentPlan.findFirst({
      where: {
        id,
        clinicId
      },
      select: {
        id: true,
        clinicId: true,
        patientId: true,
        dentistId: true,
        status: true,
        totalAmount: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        dentist: {
          select: {
            id: true,
            cro: true,
            specialty: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        items: {
          select: {
            id: true,
            planId: true,
            procedureId: true,
            description: true,
            tooth: true,
            value: true,
            quantity: true,
          },
          orderBy: {
            description: 'asc'
          }
        }
      }
    })

    if (!treatmentPlan) {
      return null
    }

    const totalAmount = Number(treatmentPlan.totalAmount)
    const finalAmount = calculateFinalAmount(
      totalAmount,
      null, // discountType
      null  // discountValue
    )

    return {
      id: treatmentPlan.id,
      clinicId: treatmentPlan.clinicId,
      patientId: treatmentPlan.patientId,
      dentistId: treatmentPlan.dentistId,
      status: treatmentPlan.status as any,
      totalAmount,
      discountType: null,
      discountValue: null,
      finalAmount,
      notes: treatmentPlan.notes,
      createdAt: treatmentPlan.createdAt,
      updatedAt: treatmentPlan.updatedAt,
      items: treatmentPlan.items.map(item => ({
        id: item.id,
        planId: item.planId,
        procedureId: item.procedureId,
        description: item.description,
        tooth: item.tooth,
        value: Number(item.value),
        quantity: item.quantity,
      })),
      patient: treatmentPlan.patient
        ? {
            id: treatmentPlan.patient.id,
            name: treatmentPlan.patient.name,
            email: treatmentPlan.patient.email,
            phone: treatmentPlan.patient.phone,
          }
        : null,
      dentist: treatmentPlan.dentist
        ? {
            id: treatmentPlan.dentist.id,
            cro: treatmentPlan.dentist.cro,
            specialty: treatmentPlan.dentist.specialty,
            user: {
              id: treatmentPlan.dentist.user.id,
              name: treatmentPlan.dentist.user.name,
              email: treatmentPlan.dentist.user.email,
            },
          }
        : null,
    }
  }

  /**
   * Cria um novo orçamento com itens em uma transação
   */
  async create(clinicId: string, data: CreateTreatmentPlanInput): Promise<TreatmentPlanOutput> {
    // Calcular total automaticamente
    const totalAmount = calculateTotalAmount(data.items)
    const finalAmount = calculateFinalAmount(
      totalAmount,
      data.discountType || null,
      data.discountValue ?? null
    )

    const result = await prisma.$transaction(async (tx) => {
      // Criar o plano de tratamento
      const treatmentPlan = await tx.treatmentPlan.create({
        data: {
          clinicId,
          patientId: data.patientId,
          dentistId: data.dentistId,
          totalAmount,
          discountType: data.discountType || null,
          discountValue: data.discountValue ? new Decimal(data.discountValue.toString()) : null,
          finalAmount: finalAmount,
          notes: data.notes || null,
        }
      })

      // Criar os itens
      const items = await tx.treatmentItem.createMany({
        data: data.items.map(item => ({
          planId: treatmentPlan.id,
          procedureId: item.procedureId || null,
          description: item.description,
          tooth: item.tooth || null,
          value: item.value,
          quantity: item.quantity,
        }))
      })

      // Buscar o resultado completo
      return await tx.treatmentPlan.findUnique({
        where: { id: treatmentPlan.id },
        select: {
          id: true,
          clinicId: true,
          patientId: true,
          dentistId: true,
          status: true,
          totalAmount: true,
          discountType: true,
          discountValue: true,
          finalAmount: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              planId: true,
              procedureId: true,
              description: true,
              tooth: true,
              value: true,
              quantity: true,
            },
            orderBy: {
              description: 'asc'
            }
          }
        }
      })
    })

    if (!result) {
      throw new Error('Erro ao criar orçamento')
    }

    return {
      id: result.id,
      clinicId: result.clinicId,
      patientId: result.patientId,
      dentistId: result.dentistId,
      status: result.status as any,
      totalAmount: Number(result.totalAmount),
      discountType: result.discountType,
      discountValue: result.discountValue ? Number(result.discountValue) : null,
      finalAmount: result.finalAmount ? Number(result.finalAmount) : Number(result.totalAmount),
      notes: result.notes,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      items: result.items.map(item => ({
        id: item.id,
        planId: item.planId,
        procedureId: item.procedureId,
        description: item.description,
        tooth: item.tooth,
        value: Number(item.value),
        quantity: item.quantity,
      }))
    }
  }

  /**
   * Atualiza um orçamento existente
   */
  async update(id: string, clinicId: string, data: UpdateTreatmentPlanInput): Promise<TreatmentPlanOutput | null> {
    // Se houver itens para atualizar, usar transação para substituir todos os itens
    if (data.items !== undefined) {
      return await prisma.$transaction(async (tx) => {
        // Verificar se o plano existe e pertence à clínica
        const existingPlan = await tx.treatmentPlan.findFirst({
          where: {
            id,
            clinicId
          }
        })

        if (!existingPlan) {
          throw new Error('Orçamento não encontrado')
        }

        // Preparar dados de atualização
        const updateData: any = {}

        if (data.status !== undefined) {
          updateData.status = data.status
        }

        if (data.notes !== undefined) {
          updateData.notes = data.notes || null
        }

        // Calcular novo total baseado nos itens fornecidos
        const items = data.items ?? []
        const newTotal = calculateTotalAmount(items)
        updateData.totalAmount = newTotal

        // discountType, discountValue e finalAmount não são salvos pois as colunas podem não existir no banco
        // finalAmount será calculado no código quando necessário

        // Deletar todos os itens existentes
        await tx.treatmentItem.deleteMany({
          where: { planId: id }
        })

        // Criar novos itens
        if (items.length > 0) {
          await tx.treatmentItem.createMany({
            data: items.map(item => ({
              planId: id,
              procedureId: item.procedureId || null,
              description: item.description,
              tooth: item.tooth || null,
              value: item.value,
              quantity: item.quantity,
            }))
          })
        }

        // Atualizar o plano
        const treatmentPlan = await tx.treatmentPlan.update({
          where: {
            id,
            clinicId
          },
          data: updateData,
          select: {
            id: true,
            clinicId: true,
            patientId: true,
            dentistId: true,
            status: true,
            totalAmount: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                id: true,
                planId: true,
                procedureId: true,
                description: true,
                tooth: true,
                value: true,
                quantity: true,
              },
              orderBy: {
                description: 'asc'
              }
            }
          }
        })

        const totalAmount = Number(treatmentPlan.totalAmount)
        const calculatedFinalAmount = calculateFinalAmount(
          totalAmount,
          null, // discountType
          null  // discountValue
        )

        return {
          id: treatmentPlan.id,
          clinicId: treatmentPlan.clinicId,
          patientId: treatmentPlan.patientId,
          dentistId: treatmentPlan.dentistId,
          status: treatmentPlan.status as any,
          totalAmount,
          discountType: null,
          discountValue: null,
          finalAmount: calculatedFinalAmount,
          notes: treatmentPlan.notes,
          createdAt: treatmentPlan.createdAt,
          updatedAt: treatmentPlan.updatedAt,
          items: treatmentPlan.items.map(item => ({
            id: item.id,
            planId: item.planId,
            procedureId: item.procedureId,
            description: item.description,
            tooth: item.tooth,
            value: Number(item.value),
            quantity: item.quantity,
          }))
        }
      })
    }

    // Caso contrário, atualização simples sem itens
    const existingPlan = await prisma.treatmentPlan.findFirst({
      where: { id, clinicId },
      select: { totalAmount: true }
    })

    if (!existingPlan) {
      throw new Error('Orçamento não encontrado')
    }

    const updateData: any = {}

    if (data.status !== undefined) {
      updateData.status = data.status
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes || null
    }

    // discountType e discountValue não são atualizados pois as colunas podem não existir no banco
    // finalAmount também não é atualizado - será calculado no código

    const treatmentPlan = await prisma.treatmentPlan.update({
      where: {
        id,
        clinicId
      },
      data: updateData,
      select: {
        id: true,
        clinicId: true,
        patientId: true,
        dentistId: true,
        status: true,
        totalAmount: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            planId: true,
            procedureId: true,
            description: true,
            tooth: true,
            value: true,
            quantity: true,
          },
          orderBy: {
            description: 'asc'
          }
        }
      }
    })

    const totalAmount = Number(treatmentPlan.totalAmount)
    const calculatedFinalAmount = calculateFinalAmount(
      totalAmount,
      null, // discountType
      null  // discountValue
    )

    return {
      id: treatmentPlan.id,
      clinicId: treatmentPlan.clinicId,
      patientId: treatmentPlan.patientId,
      dentistId: treatmentPlan.dentistId,
      status: treatmentPlan.status as any,
      totalAmount,
      discountType: null,
      discountValue: null,
      finalAmount: calculatedFinalAmount,
      notes: treatmentPlan.notes,
      createdAt: treatmentPlan.createdAt,
      updatedAt: treatmentPlan.updatedAt,
      items: treatmentPlan.items.map(item => ({
        id: item.id,
        planId: item.planId,
        procedureId: item.procedureId,
        description: item.description,
        tooth: item.tooth,
        value: Number(item.value),
        quantity: item.quantity,
      }))
    }
  }

  /**
   * Adiciona um item ao orçamento e recalcula o total
   */
  async addItem(planId: string, clinicId: string, itemData: TreatmentItemInput): Promise<TreatmentPlanOutput | null> {
    const result = await prisma.$transaction(async (tx) => {
      // Verificar se o plano existe e pertence à clínica
      const plan = await tx.treatmentPlan.findFirst({
        where: {
          id: planId,
          clinicId
        },
        include: {
          items: true
        }
      })

      if (!plan) {
        throw new Error('Orçamento não encontrado')
      }

      // Criar o novo item
      await tx.treatmentItem.create({
        data: {
          planId,
          description: itemData.description,
          tooth: itemData.tooth || null,
          value: itemData.value,
          quantity: itemData.quantity,
        }
      })

      // Buscar todos os itens atualizados para recalcular o total
      const updatedItems = await tx.treatmentItem.findMany({
        where: { planId }
      })

      const newTotal = updatedItems.reduce((total, item) => {
        return total + (Number(item.value) * item.quantity)
      }, 0)

      // Atualizar o total do plano
      return await tx.treatmentPlan.update({
        where: { id: planId },
        data: { totalAmount: newTotal },
        select: {
          id: true,
          clinicId: true,
          patientId: true,
          dentistId: true,
          status: true,
          totalAmount: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              planId: true,
              procedureId: true,
              description: true,
              tooth: true,
              value: true,
              quantity: true,
            },
            orderBy: {
              description: 'asc'
            }
          }
        }
      })
    })

    const totalAmount = Number(result.totalAmount)
    const finalAmount = calculateFinalAmount(totalAmount, null, null)
    return {
      id: result.id,
      clinicId: result.clinicId,
      patientId: result.patientId,
      dentistId: result.dentistId,
      status: result.status as any,
      totalAmount,
      discountType: null,
      discountValue: null,
      finalAmount,
      notes: result.notes,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      items: result.items.map(item => ({
        id: item.id,
        planId: item.planId,
        procedureId: item.procedureId,
        description: item.description,
        tooth: item.tooth,
        value: Number(item.value),
        quantity: item.quantity,
      }))
    }
  }

  /**
   * Remove um item do orçamento e recalcula o total
   */
  async removeItem(itemId: string, planId: string, clinicId: string): Promise<TreatmentPlanOutput | null> {
    const result = await prisma.$transaction(async (tx) => {
      // Verificar se o plano existe e pertence à clínica
      const plan = await tx.treatmentPlan.findFirst({
        where: {
          id: planId,
          clinicId
        }
      })

      if (!plan) {
        throw new Error('Orçamento não encontrado')
      }

      // Verificar se o item existe no plano
      const item = await tx.treatmentItem.findFirst({
        where: {
          id: itemId,
          planId
        }
      })

      if (!item) {
        throw new Error('Item não encontrado no orçamento')
      }

      // Remover o item
      await tx.treatmentItem.delete({
        where: { id: itemId }
      })

      // Buscar todos os itens restantes para recalcular o total
      const remainingItems = await tx.treatmentItem.findMany({
        where: { planId }
      })

      const newTotal = remainingItems.reduce((total, item) => {
        return total + (Number(item.value) * item.quantity)
      }, 0)

      // Atualizar o total do plano
      return await tx.treatmentPlan.update({
        where: { id: planId },
        data: { totalAmount: newTotal },
        select: {
          id: true,
          clinicId: true,
          patientId: true,
          dentistId: true,
          status: true,
          totalAmount: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              planId: true,
              procedureId: true,
              description: true,
              tooth: true,
              value: true,
              quantity: true,
            },
            orderBy: {
              description: 'asc'
            }
          }
        }
      })
    })

    const totalAmount = Number(result.totalAmount)
    const finalAmount = calculateFinalAmount(totalAmount, null, null)
    return {
      id: result.id,
      clinicId: result.clinicId,
      patientId: result.patientId,
      dentistId: result.dentistId,
      status: result.status as any,
      totalAmount,
      discountType: null,
      discountValue: null,
      finalAmount,
      notes: result.notes,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      items: result.items.map(item => ({
        id: item.id,
        planId: item.planId,
        procedureId: item.procedureId,
        description: item.description,
        tooth: item.tooth,
        value: Number(item.value),
        quantity: item.quantity,
      }))
    }
  }

  /**
   * Verifica se um orçamento pertence à clínica
   */
  async belongsToClinic(id: string, clinicId: string): Promise<boolean> {
    const plan = await prisma.treatmentPlan.findFirst({
      where: {
        id,
        clinicId
      },
      select: { id: true }
    })

    return !!plan
  }

  /**
   * Lista orçamentos por paciente
   */
  async findByPatientId(patientId: string, clinicId: string): Promise<TreatmentPlanOutput[]> {
    return this.findMany(clinicId, { patientId })
  }

  /**
   * Lista orçamentos por dentista
   */
  async findByDentistId(dentistId: string, clinicId: string): Promise<TreatmentPlanOutput[]> {
    return this.findMany(clinicId, { dentistId })
  }

  /**
   * Conta orçamentos por status
   */
  async countByStatus(clinicId: string): Promise<Record<string, number>> {
    const counts = await prisma.treatmentPlan.groupBy({
      by: ['status'],
      where: { clinicId },
      _count: {
        id: true
      }
    })

    const result: Record<string, number> = {
      OPEN: 0,
      APPROVED: 0,
      REJECTED: 0
    }

    counts.forEach(count => {
      result[count.status] = count._count.id
    })

    return result
  }

  /**
   * Calcula valor total de orçamentos aprovados
   */
  async getTotalApprovedValue(clinicId: string): Promise<number> {
    const result = await prisma.treatmentPlan.aggregate({
      where: {
        clinicId,
        status: 'APPROVED'
      },
      _sum: {
        totalAmount: true
      }
    })

    return Number(result._sum.totalAmount) || 0
  }
}

// Exportar instância singleton
export const treatmentPlanRepository = new TreatmentPlanRepository()