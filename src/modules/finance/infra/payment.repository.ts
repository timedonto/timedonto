import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/database'
import { startOfDay, endOfDay } from 'date-fns'
import {
  CreatePaymentInput,
  ListPaymentsInput,
  PaymentOutput,
  PaymentMethod,
  calculateFinalAmount
} from '../domain/payment.schema'

// Interface para resumo diário/mensal
export interface PaymentSummary {
  method: PaymentMethod
  total: number
  count: number
}

export interface DailySummary {
  date: string
  totalAmount: number
  totalCount: number
  byMethod: PaymentSummary[]
}

export interface MonthlySummary {
  year: number
  month: number
  totalAmount: number
  totalCount: number
  byMethod: PaymentSummary[]
}

export class PaymentRepository {
  /**
   * Lista pagamentos de uma clínica com filtros opcionais
   */
  async findMany(clinicId: string, filters?: ListPaymentsInput): Promise<PaymentOutput[]> {
    const where: any = {
      clinicId,
    }

    // Aplicar filtros
    if (filters?.patientId) {
      where.patientId = filters.patientId
    }

    if (filters?.method) {
      where.method = filters.method
    }

    // Filtro por período de datas
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      
      if (filters.endDate) {
        // Adicionar 23:59:59 para incluir todo o dia final
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        clinicId: true,
        patientId: true,
        amount: true,
        method: true,
        description: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        paymentTreatmentPlans: {
          select: {
            treatmentPlan: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                notes: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return payments.map(payment => ({
      id: payment.id,
      clinicId: payment.clinicId,
      patientId: payment.patientId,
      originalAmount: Number(payment.amount), // Usar amount como fallback
      discountType: null,
      discountValue: null,
      amount: Number(payment.amount),
      method: payment.method as PaymentMethod,
      description: payment.description,
      createdAt: payment.createdAt,
      patient: payment.patient,
      treatmentPlans: payment.paymentTreatmentPlans.map(ptp => ({
        id: ptp.treatmentPlan.id,
        status: ptp.treatmentPlan.status,
        totalAmount: Number(ptp.treatmentPlan.totalAmount),
        notes: ptp.treatmentPlan.notes,
      }))
    }))
  }

  /**
   * Busca pagamento por ID validando que pertence à clínica
   */
  async findById(id: string, clinicId: string): Promise<PaymentOutput | null> {
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        clinicId
      },
      select: {
        id: true,
        clinicId: true,
        patientId: true,
        amount: true,
        method: true,
        description: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        paymentTreatmentPlans: {
          select: {
            treatmentPlan: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                notes: true,
              }
            }
          }
        }
      }
    })

    if (!payment) {
      return null
    }

    return {
      id: payment.id,
      clinicId: payment.clinicId,
      patientId: payment.patientId,
      originalAmount: Number(payment.amount), // Usar amount como fallback
      discountType: null,
      discountValue: null,
      amount: Number(payment.amount),
      method: payment.method as PaymentMethod,
      description: payment.description,
      createdAt: payment.createdAt,
      patient: payment.patient,
      treatmentPlans: payment.paymentTreatmentPlans.map(ptp => ({
        id: ptp.treatmentPlan.id,
        status: ptp.treatmentPlan.status,
        totalAmount: Number(ptp.treatmentPlan.totalAmount),
        notes: ptp.treatmentPlan.notes,
      }))
    }
  }

  /**
   * Cria um novo pagamento
   */
  async create(clinicId: string, data: CreatePaymentInput): Promise<PaymentOutput> {
    // Se há treatment plans, usar transação para criar payment e relações
    if (data.treatmentPlanIds && data.treatmentPlanIds.length > 0) {
      return await prisma.$transaction(async (tx) => {
        // Buscar os treatment plans para calcular originalAmount
        const treatmentPlans = await tx.treatmentPlan.findMany({
          where: {
            id: { in: data.treatmentPlanIds },
            clinicId
          },
          select: {
            id: true,
            status: true,
            finalAmount: true,
            notes: true,
          }
        })

        // Calcular originalAmount (soma dos finalAmount dos orçamentos)
        const originalAmount = treatmentPlans.reduce((sum, tp) => sum + Number(tp.finalAmount), 0)

        // Calcular finalAmount com desconto
        const finalAmount = calculateFinalAmount(
          originalAmount,
          data.discountType || null,
          data.discountValue ?? null
        )

        // Criar o pagamento
        const payment = await tx.payment.create({
          data: {
            clinicId,
            patientId: data.patientId || null,
            amount: finalAmount,
            method: data.method,
            description: data.description || null,
          },
          select: {
            id: true,
            clinicId: true,
            patientId: true,
            originalAmount: true,
            discountType: true,
            discountValue: true,
            amount: true,
            method: true,
            description: true,
            createdAt: true,
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        })

        // Criar as relações payment-treatmentPlan
        await tx.paymentTreatmentPlan.createMany({
          data: data.treatmentPlanIds.map(treatmentPlanId => ({
            paymentId: payment.id,
            treatmentPlanId,
          }))
        })

        // Atualizar status dos treatment plans de OPEN para APPROVED
        await tx.treatmentPlan.updateMany({
          where: {
            id: { in: data.treatmentPlanIds },
            status: 'OPEN'
          },
          data: {
            status: 'APPROVED'
          }
        })

        return {
          id: payment.id,
          clinicId: payment.clinicId,
          patientId: payment.patientId,
          originalAmount: Number(payment.amount), // Usar amount como fallback
          discountType: null,
          discountValue: null,
          amount: Number(payment.amount),
          method: payment.method as PaymentMethod,
          description: payment.description,
          createdAt: payment.createdAt,
          patient: payment.patient,
          treatmentPlans: treatmentPlans.map(tp => ({
            id: tp.id,
            status: tp.status,
            totalAmount: Number(tp.finalAmount),
            notes: tp.notes,
          }))
        }
      })
    }

    // Caso não há treatment plans, criar apenas o pagamento
    // amount é obrigatório neste caso (validado no schema)
    const originalAmount = data.amount!
    const finalAmount = calculateFinalAmount(
      originalAmount,
      data.discountType || null,
      data.discountValue ?? null
    )

    const payment = await prisma.payment.create({
      data: {
        clinicId,
        patientId: data.patientId || null,
        originalAmount,
        // discountType e discountValue não existem no banco - removido
        amount: finalAmount,
        method: data.method,
        description: data.description || null,
      },
      select: {
        id: true,
        clinicId: true,
        patientId: true,
        amount: true,
        method: true,
        description: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    return {
      id: payment.id,
      clinicId: payment.clinicId,
      patientId: payment.patientId,
      originalAmount: Number(payment.amount), // Usar amount como fallback
      discountType: null,
      discountValue: null,
      amount: Number(payment.amount),
      method: payment.method as PaymentMethod,
      description: payment.description,
      createdAt: payment.createdAt,
      patient: payment.patient,
      treatmentPlans: []
    }
  }

  /**
   * Obtém resumo diário de pagamentos agrupado por método
   */
  async getDailySummary(clinicId: string, date: Date): Promise<DailySummary> {
    // Definir início e fim do dia
    const start = startOfDay(date)
    const end = endOfDay(date)

    // Buscar pagamentos do dia agrupados por método
    const payments = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        clinicId,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Calcular totais gerais
    const totalAmount = payments.reduce((sum, payment) => {
      return sum + Number(payment._sum.amount || 0)
    }, 0)

    const totalCount = payments.reduce((sum, payment) => {
      return sum + payment._count.id
    }, 0)

    // Mapear resumo por método
    const byMethod: PaymentSummary[] = payments.map(payment => ({
      method: payment.method as PaymentMethod,
      total: Number(payment._sum.amount || 0),
      count: payment._count.id
    }))

    const result = {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      totalAmount,
      totalCount,
      byMethod
    }

    console.log('paymentRepository.getDailySummary result:', { clinicId, date: start.toISOString(), summary: result })

    return result
  }

  /**
   * Obtém resumo mensal de pagamentos agrupado por método
   */
  async getMonthlySummary(clinicId: string, year: number, month: number): Promise<MonthlySummary> {
    // Definir início e fim do mês
    const startOfMonth = new Date(year, month - 1, 1) // month é 0-indexed no Date
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999) // Último dia do mês

    // Buscar pagamentos do mês agrupados por método
    const payments = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        clinicId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Calcular totais gerais
    const totalAmount = payments.reduce((sum, payment) => {
      return sum + Number(payment._sum.amount || 0)
    }, 0)

    const totalCount = payments.reduce((sum, payment) => {
      return sum + payment._count.id
    }, 0)

    // Mapear resumo por método
    const byMethod: PaymentSummary[] = payments.map(payment => ({
      method: payment.method as PaymentMethod,
      total: Number(payment._sum.amount || 0),
      count: payment._count.id
    }))

    return {
      year,
      month,
      totalAmount,
      totalCount,
      byMethod
    }
  }

  /**
   * Verifica se um pagamento pertence à clínica
   */
  async belongsToClinic(id: string, clinicId: string): Promise<boolean> {
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        clinicId
      },
      select: { id: true }
    })

    return !!payment
  }

  /**
   * Lista pagamentos por paciente
   */
  async findByPatientId(patientId: string, clinicId: string): Promise<PaymentOutput[]> {
    return this.findMany(clinicId, { patientId })
  }

  /**
   * Lista pagamentos por método
   */
  async findByMethod(method: PaymentMethod, clinicId: string): Promise<PaymentOutput[]> {
    return this.findMany(clinicId, { method })
  }

  /**
   * Conta pagamentos por método
   */
  async countByMethod(clinicId: string): Promise<Record<PaymentMethod, number>> {
    const counts = await prisma.payment.groupBy({
      by: ['method'],
      where: { clinicId },
      _count: {
        id: true
      }
    })

    const result: Record<PaymentMethod, number> = {
      CASH: 0,
      PIX: 0,
      CARD: 0
    }

    counts.forEach(count => {
      result[count.method as PaymentMethod] = count._count.id
    })

    return result
  }

  /**
   * Calcula total de pagamentos por período
   */
  async getTotalByPeriod(
    clinicId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        clinicId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      }
    })

    return Number(result._sum.amount) || 0
  }

  /**
   * Obtém pagamentos recentes (últimos N)
   */
  async findRecent(clinicId: string, limit: number = 10): Promise<PaymentOutput[]> {
    const payments = await prisma.payment.findMany({
      where: { clinicId },
      select: {
        id: true,
        clinicId: true,
        patientId: true,
        amount: true,
        method: true,
        description: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        paymentTreatmentPlans: {
          select: {
            treatmentPlan: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                notes: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return payments.map(payment => ({
      id: payment.id,
      clinicId: payment.clinicId,
      patientId: payment.patientId,
      amount: Number(payment.amount),
      method: payment.method as PaymentMethod,
      description: payment.description,
      createdAt: payment.createdAt,
      patient: payment.patient,
      treatmentPlans: payment.paymentTreatmentPlans.map(ptp => ({
        id: ptp.treatmentPlan.id,
        status: ptp.treatmentPlan.status,
        totalAmount: Number(ptp.treatmentPlan.totalAmount),
        notes: ptp.treatmentPlan.notes,
      }))
    }))
  }

  /**
   * Obtém estatísticas gerais de pagamentos
   */
  async getGeneralStats(clinicId: string): Promise<{
    totalAmount: number
    totalCount: number
    averageAmount: number
    todayAmount: number
    monthAmount: number
  }> {
    // Total geral
    const totalStats = await prisma.payment.aggregate({
      where: { clinicId },
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true }
    })

    // Hoje
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setHours(23, 59, 59, 999)

    const todayStats = await prisma.payment.aggregate({
      where: {
        clinicId,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      _sum: { amount: true }
    })

    // Este mês
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

    const monthStats = await prisma.payment.aggregate({
      where: {
        clinicId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { amount: true }
    })

    return {
      totalAmount: Number(totalStats._sum.amount) || 0,
      totalCount: totalStats._count.id || 0,
      averageAmount: Number(totalStats._avg.amount) || 0,
      todayAmount: Number(todayStats._sum.amount) || 0,
      monthAmount: Number(monthStats._sum.amount) || 0
    }
  }
}

// Exportar instância singleton
export const paymentRepository = new PaymentRepository()