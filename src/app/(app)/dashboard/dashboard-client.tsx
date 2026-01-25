'use client'

import { useDashboard } from '@/hooks/use-dashboard'
import { 
  MetricsCards,
  MonthlyPerformanceChart,
  UpcomingAppointments,
  RecentActivity,
  DashboardLoadingSkeleton
} from '@/components/dashboard'

export function DashboardClient() {
  const { data, loading, error } = useDashboard()

  if (loading) {
    return <DashboardLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400 text-sm">
          Erro ao carregar dados do dashboard: {error}
        </p>
      </div>
    )
  }

  if (!data) {
    return <DashboardLoadingSkeleton />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Métricas principais */}
      <MetricsCards metrics={data.metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Gráfico de desempenho mensal */}
        <MonthlyPerformanceChart data={data.monthlyPerformance} />

        {/* Próximas consultas */}
        <UpcomingAppointments appointments={data.upcomingAppointments} />
      </div>

      {/* Atividade recente */}
      <RecentActivity activities={data.recentActivities} />
    </div>
  )
}