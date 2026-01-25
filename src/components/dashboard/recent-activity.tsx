'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { RecentActivity } from '@/modules/dashboard/application'

interface RecentActivityProps {
  activities: RecentActivity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-base sm:text-lg font-bold text-heading">Atividade Recente</h3>
        <div className="flex space-x-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary w-full sm:w-48 h-9" 
              placeholder="Filtrar..." 
              type="text" 
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-3 font-bold">Data</th>
              <th className="px-6 py-3 font-bold">Paciente</th>
              <th className="px-6 py-3 font-bold">Serviço</th>
              <th className="px-6 py-3 font-bold">Profissional</th>
              <th className="px-6 py-3 font-bold">Valor</th>
              <th className="px-6 py-3 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-sm">Nenhuma atividade recente</p>
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-xs">{activity.date}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{activity.patientName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{activity.serviceName}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{activity.dentistName}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(activity.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      activity.status === 'paid' 
                        ? "bg-primary/10 text-heading dark:bg-primary/20 dark:text-primary"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {activity.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}