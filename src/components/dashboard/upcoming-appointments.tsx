'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UpcomingAppointment } from '@/modules/dashboard/application'

interface UpcomingAppointmentsProps {
  appointments: UpcomingAppointment[]
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base sm:text-lg font-bold text-heading">Próximas Consultas</h3>
        <button className="text-xs text-primary font-semibold hover:underline">Ver todas</button>
      </div>
      
      <div className="space-y-4 flex-1">
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p className="text-sm">Nenhuma consulta agendada</p>
          </div>
        ) : (
          appointments.map((appointment) => {
            // Cores baseadas nas iniciais para consistência visual
            const colors = [
              { bg: 'bg-primary/20', text: 'text-heading' },
              { bg: 'bg-chart-main/20', text: 'text-chart-main' },
              { bg: 'bg-chart-subtle/40', text: 'text-heading' },
              { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
              { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' }
            ]
            
            const colorIndex = appointment.patientInitials.charCodeAt(0) % colors.length
            const color = colors[colorIndex]
            
            return (
              <div 
                key={appointment.id} 
                className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
              >
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold mr-3 sm:mr-4 text-xs sm:text-base",
                  color.bg,
                  color.text
                )}>
                  {appointment.patientInitials}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-semibold">{appointment.patientName}</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    {appointment.procedureName}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {appointment.time}
                  </div>
                  <div className={cn(
                    "text-[10px]",
                    appointment.isToday ? "text-primary font-medium" : "text-slate-400"
                  )}>
                    {appointment.date}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      
      <Button className="mt-6 w-full py-5 sm:py-6 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-colors flex items-center justify-center h-10 sm:h-12 text-sm sm:text-base">
        <Plus className="h-4 w-4 mr-2" />
        Novo Agendamento
      </Button>
    </div>
  )
}