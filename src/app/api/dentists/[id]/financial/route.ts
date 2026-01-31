import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/roles'
import { AttendanceStatus } from '@/types/attendances'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { dentistRepository } from '@/modules/dentists/infra/dentist.repository'

interface FinancialTransaction {
  id: string
  date: Date
  patientId: string
  patientName: string
  procedureName: string
  grossValue: number
  commission: number
  commissionType: 'GENERAL' | 'PROCEDURE'
  status: 'PAGO' | 'PENDENTE'
  source: 'TREATMENT_PLAN' | 'ATTENDANCE'
  sourceId: string
}

interface FinancialData {
  commissionPercentage: number | null
  grossProduction: number
  totalReceived: number
  totalPending: number
  netReceived: number
  transactions: FinancialTransaction[]
}

/**
 * GET /api/dentists/[id]/financial
 * Retorna dados financeiros e comissões do dentista
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.clinicId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id: dentistId } = await params
    const clinicId = session.user.clinicId

    // Verificar se dentista existe e pertence à clínica
    const dentist = await dentistRepository.findById(dentistId, clinicId)
    if (!dentist) {
      return NextResponse.json(
        { success: false, error: 'Dentista não encontrado' },
        { status: 404 }
      )
    }

    // Controle de acesso: apenas OWNER/ADMIN ou o próprio dentista
    const userRole = session.user.role as UserRole
    const isOwnerOrAdmin = userRole === UserRole.OWNER || userRole === UserRole.ADMIN
    const isOwnProfile = session.user.id === dentist.userId

    if (!isOwnerOrAdmin && !isOwnProfile) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Ler query parameters para filtros
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const patientId = searchParams.get('patientId')
    const procedureId = searchParams.get('procedureId')
    const commissionTypeFilter = searchParams.get('commissionType') as 'GENERAL' | 'PROCEDURE' | null

    // Construir filtros de data
    const dateFilter: any = {}
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom)
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      dateFilter.lte = endDate
    }

    const transactions: FinancialTransaction[] = []
    const commissionPercentage = dentist.commission ? Number(dentist.commission) : null

    // 1. Buscar pagamentos vinculados a orçamentos do dentista
    const payments = await prisma.payment.findMany({
      where: {
        clinicId,
        ...(patientId && { patientId }),
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        paymentTreatmentPlans: {
          some: {
            treatmentPlan: {
              dentistId,
              ...(procedureId && {
                items: {
                  some: {
                    procedureId
                  }
                }
              })
            }
          }
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        paymentTreatmentPlans: {
          include: {
            treatmentPlan: {
              include: {
                items: {
                  include: {
                    procedure: {
                      select: {
                        id: true,
                        name: true,
                        commissionPercentage: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Processar pagamentos de orçamentos
    for (const payment of payments) {
      for (const ptp of payment.paymentTreatmentPlans) {
        const treatmentPlan = ptp.treatmentPlan
        
        // Processar cada item do orçamento
        for (const item of treatmentPlan.items) {
          const itemValue = Number(item.value) * item.quantity
          let commission = 0
          let commissionType: 'GENERAL' | 'PROCEDURE' = 'GENERAL'

          // Calcular comissão
          if (item.procedure?.commissionPercentage) {
            // Usar comissão do procedimento
            commission = (itemValue * Number(item.procedure.commissionPercentage)) / 100
            commissionType = 'PROCEDURE'
          } else if (commissionPercentage) {
            // Usar comissão geral do dentista
            commission = (itemValue * commissionPercentage) / 100
            commissionType = 'GENERAL'
          }

          // Filtrar por tipo de comissão se especificado
          if (commissionType && commissionType !== commissionType) {
            continue
          }

          transactions.push({
            id: `${payment.id}-${item.id}`,
            date: payment.createdAt,
            patientId: payment.patientId || treatmentPlan.patientId,
            patientName: payment.patient?.name || 'Paciente não informado',
            procedureName: item.description,
            grossValue: itemValue,
            commission,
            commissionType,
            status: 'PAGO',
            source: 'TREATMENT_PLAN',
            sourceId: treatmentPlan.id
          })
        }
      }
    }

    // 2. Buscar procedimentos de atendimentos finalizados do dentista
    const attendances = await prisma.attendance.findMany({
      where: {
        clinicId,
        dentistId,
        status: AttendanceStatus.DONE,
        ...(patientId && { patientId }),
        ...(Object.keys(dateFilter).length > 0 && {
          finishedAt: dateFilter
        }),
        procedures: {
          ...(procedureId && {
            some: {
              procedureId
            }
          })
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        procedures: {
          where: {
            ...(procedureId && { procedureId }),
            dentistId // Apenas procedimentos do dentista
          },
          include: {
            procedure: {
              select: {
                id: true,
                name: true,
                baseValue: true,
                commissionPercentage: true
              }
            }
          }
        }
      },
      orderBy: {
        finishedAt: 'desc'
      }
    })

    // Processar procedimentos de atendimentos
    for (const attendance of attendances) {
      for (const attendanceProcedure of attendance.procedures) {
        const procedurePrice = attendanceProcedure.price 
          ? Number(attendanceProcedure.price) * attendanceProcedure.quantity
          : attendanceProcedure.procedure?.baseValue
            ? Number(attendanceProcedure.procedure.baseValue) * attendanceProcedure.quantity
            : 0

        if (procedurePrice === 0) continue

        let commission = 0
        let commissionType: 'GENERAL' | 'PROCEDURE' = 'GENERAL'

        // Calcular comissão
        if (attendanceProcedure.procedure?.commissionPercentage) {
          // Usar comissão do procedimento
          commission = (procedurePrice * Number(attendanceProcedure.procedure.commissionPercentage)) / 100
          commissionType = 'PROCEDURE'
        } else if (commissionPercentage) {
          // Usar comissão geral do dentista
          commission = (procedurePrice * commissionPercentage) / 100
          commissionType = 'GENERAL'
        }

        // Filtrar por tipo de comissão se especificado
        if (commissionTypeFilter && commissionTypeFilter !== commissionType) {
          continue
        }

        // Verificar se há pagamento vinculado (via orçamento aprovado)
        const hasPayment = await prisma.paymentTreatmentPlan.findFirst({
          where: {
            treatmentPlan: {
              dentistId,
              patientId: attendance.patientId,
              status: 'APPROVED'
            }
          }
        })

        transactions.push({
          id: `${attendance.id}-${attendanceProcedure.id}`,
          date: attendance.finishedAt || attendance.arrivalAt,
          patientId: attendance.patientId,
          patientName: attendance.patient.name,
          procedureName: attendanceProcedure.description,
          grossValue: procedurePrice,
          commission,
          commissionType,
          status: hasPayment ? 'PAGO' : 'PENDENTE',
          source: 'ATTENDANCE',
          sourceId: attendance.id
        })
      }
    }

    // Calcular métricas agregadas
    const grossProduction = transactions.reduce((sum, t) => sum + t.grossValue, 0)
    const totalReceived = transactions
      .filter(t => t.status === 'PAGO')
      .reduce((sum, t) => sum + t.commission, 0)
    const totalPending = transactions
      .filter(t => t.status === 'PENDENTE')
      .reduce((sum, t) => sum + t.commission, 0)
    const netReceived = totalReceived

    const financialData: FinancialData = {
      commissionPercentage,
      grossProduction,
      totalReceived,
      totalPending,
      netReceived,
      transactions: transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
    }

    return NextResponse.json({
      success: true,
      data: financialData
    })

  } catch (error) {
    console.error('Erro ao buscar dados financeiros do dentista:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
