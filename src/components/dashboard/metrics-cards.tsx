'use client'

import { UserPlus, CalendarDays, DollarSign, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/format'
import type { DashboardMetrics } from '@/modules/dashboard/application'

interface MetricsCardsProps {
  metrics: DashboardMetrics
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {/* Novos Pacientes */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-border-subtle dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Novos Pacientes</span>
          <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-heading">{metrics.newPatients.current}</div>
            {metrics.newPatients.percentageChange !== 0 && (
              <div className={`text-xs font-medium flex items-center mt-1 ${
                metrics.newPatients.percentageChange > 0 ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {metrics.newPatients.percentageChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {formatPercentage(metrics.newPatients.percentageChange)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consultas Hoje */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-border-subtle dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Consultas Hoje</span>
          <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-heading">{metrics.todayAppointments.total.toString().padStart(2, '0')}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">
              {metrics.todayAppointments.completed} concluídas, {metrics.todayAppointments.pending} pendentes
            </div>
          </div>
        </div>
      </div>

      {/* Receita Mensal */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-border-subtle dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Receita Mensal</span>
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-heading">{formatCurrency(metrics.monthlyRevenue.current)}</div>
            <div className="flex items-center mt-2 space-x-1">
              {/* Mini chart bars */}
              <div className="w-1 bg-chart-main h-2 rounded-full"></div>
              <div className="w-1 bg-chart-main h-4 rounded-full"></div>
              <div className="w-1 bg-chart-main h-3 rounded-full"></div>
              <div className="w-1 bg-chart-main h-5 rounded-full"></div>
              <div className="w-1 bg-chart-main h-4 rounded-full"></div>
              <span className="text-[10px] text-slate-400 ml-2 uppercase font-bold tracking-wider">
                Tendência {metrics.monthlyRevenue.trend === 'up' ? 'alta' : metrics.monthlyRevenue.trend === 'down' ? 'baixa' : 'estável'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orçamentos Abertos */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-border-subtle dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Orçamentos Abertos</span>
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-heading">{metrics.openTreatmentPlans.count}</div>
            <div className="text-xs text-amber-500 font-medium mt-1">
              {formatCurrency(metrics.openTreatmentPlans.totalAmount)} em aberto
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}