'use client'

import { cn } from '@/lib/utils'
import type { MonthlyPerformance } from '@/modules/dashboard/application'

interface MonthlyPerformanceChartProps {
  data: MonthlyPerformance[]
}

export function MonthlyPerformanceChart({ data }: MonthlyPerformanceChartProps) {
  // Encontrar o valor máximo para normalizar as barras
  const maxRevenue = Math.max(...data.map(d => d.revenue))
  
  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h3 className="text-base sm:text-lg font-bold text-heading">Desempenho Mensal</h3>
        <select className="text-sm border-slate-200 dark:border-slate-700 bg-transparent rounded-md dark:text-slate-400 focus:ring-primary w-full sm:w-auto">
          <option>Últimos 6 meses</option>
          <option>Último ano</option>
        </select>
      </div>
      <div className="h-48 sm:h-64 flex items-end justify-between px-2 sm:px-4 space-x-2 sm:space-x-6">
        {data.map((monthData) => {
          const heightPercentage = maxRevenue > 0 ? (monthData.revenue / maxRevenue) * 100 : 0
          
          return (
            <div key={monthData.month} className="flex-1 flex flex-col items-center group">
              <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-t-md h-full relative overflow-hidden min-h-[10px]">
                <div 
                  className={cn(
                    "absolute inset-x-0 bottom-0 rounded-t-md transition-all group-hover:opacity-80",
                    monthData.isCurrentMonth ? "bg-chart-main" : "bg-chart-subtle"
                  )}
                  style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                />
              </div>
              <span className="text-[10px] mt-2 text-slate-500 uppercase font-semibold">
                {monthData.month}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}