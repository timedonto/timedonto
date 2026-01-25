import { prisma } from '@/lib/database'
import type { DashboardData, DashboardMetrics, MonthlyPerformance, UpcomingAppointment, RecentActivity } from '../domain/types'

export class GetDashboardDataUseCase {
  async execute(clinicId: string): Promise<DashboardData> {
    const [
      metrics,
      monthlyPerformance,
      upcomingAppointments,
      recentActivities
    ] = await Promise.all([
      this.getMetrics(clinicId),
      this.getMonthlyPerformance(clinicId),
      this.getUpcomingAppointments(clinicId),
      this.getRecentActivities(clinicId)
    ])

    return {
      metrics,
      monthlyPerformance,
      upcomingAppointments,
      recentActivities
    }
  }

  private async getMetrics(clinicId: string): Promise<DashboardMetrics> {
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    // Novos pacientes do mês atual
    const [currentMonthPatients, previousMonthPatients] = await Promise.all([
      prisma.patient.count({
        where: {
          clinicId,
          createdAt: {
            gte: currentMonth,
            lt: nextMonth
          }
        }
      }),
      prisma.patient.count({
        where: {
          clinicId,
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      })
    ])

    // Consultas de hoje
    const [todayTotal, todayCompleted] = await Promise.all([
      prisma.appointment.count({
        where: {
          clinicId,
          date: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.appointment.count({
        where: {
          clinicId,
          date: {
            gte: today,
            lt: tomorrow
          },
          status: 'DONE'
        }
      })
    ])

    // Receita mensal
    const [currentMonthRevenue, previousMonthRevenue] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          clinicId,
          createdAt: {
            gte: currentMonth,
            lt: nextMonth
          }
        },
        _sum: {
          amount: true
        }
      }),
      prisma.payment.aggregate({
        where: {
          clinicId,
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        },
        _sum: {
          amount: true
        }
      })
    ])

    // Orçamentos abertos
    const [openTreatmentPlansCount, openTreatmentPlansSum] = await Promise.all([
      prisma.treatmentPlan.count({
        where: {
          clinicId,
          status: 'OPEN'
        }
      }),
      prisma.treatmentPlan.aggregate({
        where: {
          clinicId,
          status: 'OPEN'
        },
        _sum: {
          totalAmount: true
        }
      })
    ])

    // Calcular percentuais de mudança
    const patientsChange = previousMonthPatients > 0 
      ? ((currentMonthPatients - previousMonthPatients) / previousMonthPatients) * 100 
      : currentMonthPatients > 0 ? 100 : 0

    const currentRevenue = Number(currentMonthRevenue._sum.amount || 0)
    const previousRevenue = Number(previousMonthRevenue._sum.amount || 0)
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0

    const trend: 'up' | 'down' | 'stable' = 
      revenueChange > 5 ? 'up' : 
      revenueChange < -5 ? 'down' : 'stable'

    return {
      newPatients: {
        current: currentMonthPatients,
        previous: previousMonthPatients,
        percentageChange: Math.round(patientsChange)
      },
      todayAppointments: {
        total: todayTotal,
        completed: todayCompleted,
        pending: todayTotal - todayCompleted
      },
      monthlyRevenue: {
        current: currentRevenue,
        previous: previousRevenue,
        percentageChange: Math.round(revenueChange),
        trend
      },
      openTreatmentPlans: {
        count: openTreatmentPlansCount,
        totalAmount: Number(openTreatmentPlansSum._sum.totalAmount || 0)
      }
    }
  }

  private async getMonthlyPerformance(clinicId: string): Promise<MonthlyPerformance[]> {
    const now = new Date()
    const months = []
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const revenue = await prisma.payment.aggregate({
        where: {
          clinicId,
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _sum: {
          amount: true
        }
      })

      months.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short' }),
        revenue: Number(revenue._sum.amount || 0),
        isCurrentMonth: i === 0
      })
    }

    return months
  }

  private async getUpcomingAppointments(clinicId: string): Promise<UpcomingAppointment[]> {
    const now = new Date()
    
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        date: {
          gte: now
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      },
      include: {
        patient: {
          select: {
            name: true
          }
        },
        procedureRelation: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 5
    })

    return appointments.map(appointment => {
      const patientName = appointment.patient.name
      const nameParts = patientName.split(' ')
      const initials = nameParts.length >= 2 
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : patientName.substring(0, 2).toUpperCase()

      const appointmentDate = new Date(appointment.date)
      const today = new Date()
      const isToday = appointmentDate.toDateString() === today.toDateString()

      return {
        id: appointment.id,
        patientName,
        patientInitials: initials,
        procedureName: appointment.procedureRelation?.name || appointment.procedure || 'Consulta',
        time: appointmentDate.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        date: isToday ? 'Hoje' : appointmentDate.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        isToday
      }
    })
  }

  private async getRecentActivities(clinicId: string): Promise<RecentActivity[]> {
    const payments = await prisma.payment.findMany({
      where: {
        clinicId
      },
      include: {
        patient: {
          select: {
            name: true
          }
        },
        paymentTreatmentPlans: {
          include: {
            treatmentPlan: {
              include: {
                dentist: {
                  include: {
                    user: {
                      select: {
                        name: true
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
      },
      take: 10
    })

    return payments.map(payment => ({
      id: payment.id,
      date: payment.createdAt.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      patientName: payment.patient?.name || 'Paciente não informado',
      serviceName: payment.description || 'Pagamento',
      dentistName: payment.paymentTreatmentPlans[0]?.treatmentPlan.dentist.user.name || 'N/A',
      amount: Number(payment.amount),
      status: 'paid' as const // Todos os payments são considerados pagos
    }))
  }
}

export const getDashboardDataUseCase = new GetDashboardDataUseCase()