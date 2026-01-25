// Tipos de domínio para o Dashboard

export interface DashboardMetrics {
  newPatients: {
    current: number
    previous: number
    percentageChange: number
  }
  todayAppointments: {
    total: number
    completed: number
    pending: number
  }
  monthlyRevenue: {
    current: number
    previous: number
    percentageChange: number
    trend: 'up' | 'down' | 'stable'
  }
  openTreatmentPlans: {
    count: number
    totalAmount: number
  }
}

export interface MonthlyPerformance {
  month: string
  revenue: number
  isCurrentMonth: boolean
}

export interface UpcomingAppointment {
  id: string
  patientName: string
  patientInitials: string
  procedureName: string
  time: string
  date: string
  isToday: boolean
}

export interface RecentActivity {
  id: string
  date: string
  patientName: string
  serviceName: string
  dentistName: string
  amount: number
  status: 'paid' | 'pending'
}

export interface DashboardData {
  metrics: DashboardMetrics
  monthlyPerformance: MonthlyPerformance[]
  upcomingAppointments: UpcomingAppointment[]
  recentActivities: RecentActivity[]
}