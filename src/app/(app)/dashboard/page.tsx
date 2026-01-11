import { getSessionUser } from '@/modules/auth/application'
import { 
  UserPlus, 
  CalendarDays, 
  DollarSign, 
  FileText, 
  TrendingUp,
  Search,
  Plus,
  ArrowUpRight
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const user = await getSessionUser()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-heading">Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
          Bem-vindo de volta, {user?.name}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border-subtle dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Novos Pacientes</span>
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-heading">12</div>
              <div className="text-xs text-emerald-500 font-medium flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" /> +14%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border-subtle dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Consultas Hoje</span>
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-heading">08</div>
              <div className="text-xs text-slate-400 font-medium mt-1">4 concluídas, 4 pendentes</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border-subtle dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Receita Mensal</span>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-heading">R$ 14.280</div>
              <div className="flex items-center mt-2 space-x-1">
                <div className="w-1 bg-chart-main h-2 rounded-full"></div>
                <div className="w-1 bg-chart-main h-4 rounded-full"></div>
                <div className="w-1 bg-chart-main h-3 rounded-full"></div>
                <div className="w-1 bg-chart-main h-5 rounded-full"></div>
                <div className="w-1 bg-chart-main h-4 rounded-full"></div>
                <span className="text-[10px] text-slate-400 ml-2 uppercase font-bold tracking-wider">Tendência alta</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border-subtle dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Orçamentos Abertos</span>
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-heading">24</div>
              <div className="text-xs text-amber-500 font-medium mt-1">R$ 4.500 em aberto</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart Placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-heading">Desempenho Mensal</h3>
            <select className="text-sm border-slate-200 dark:border-slate-700 bg-transparent rounded-md dark:text-slate-400 focus:ring-primary">
              <option>Últimos 6 meses</option>
              <option>Último ano</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between px-4 space-x-6">
            {[
              { month: 'Jan', val: 32, current: false },
              { month: 'Fev', val: 48, current: false },
              { month: 'Mar', val: 40, current: false },
              { month: 'Abr', val: 56, current: true },
              { month: 'Mai', val: 44, current: false },
              { month: 'Jun', val: 52, current: false },
            ].map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center group">
                <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-t-md h-full relative overflow-hidden min-h-[10px]">
                  <div 
                    className={cn(
                      "absolute inset-x-0 bottom-0 rounded-t-md transition-all group-hover:opacity-80",
                      d.current ? "bg-chart-main" : "bg-chart-subtle"
                    )}
                    style={{ height: `${(d.val / 60) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] mt-2 text-slate-500 uppercase font-semibold">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-heading">Próximas Consultas</h3>
            <button className="text-xs text-primary font-semibold hover:underline">Ver todas</button>
          </div>
          <div className="space-y-4 flex-1">
            {[
              { name: 'Julia Duarte', type: 'Limpeza e Avaliação', time: '14:00', initial: 'JD', color: 'bg-primary/20', textColor: 'text-heading' },
              { name: 'Marcos Rocha', type: 'Extração Sisos', time: '15:30', initial: 'MR', color: 'bg-chart-main/20', textColor: 'text-chart-main' },
              { name: 'Ana Luiza', type: 'Manutenção Aparelho', time: '16:45', initial: 'AL', color: 'bg-chart-subtle/40', textColor: 'text-heading' },
            ].map((app) => (
              <div key={app.name} className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4", app.color, app.textColor)}>
                  {app.initial}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">{app.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{app.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{app.time}</div>
                  <div className="text-[10px] text-slate-400">Hoje</div>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-6 w-full py-6 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-colors flex items-center justify-center h-12">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-heading">Atividade Recente</h3>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary w-48 h-9" 
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
              {[
                { date: '22 Abr, 10:30', patient: 'Carlos Andrade', service: 'Implante Dentário', doc: 'Dr. Ricardo S.', value: 'R$ 1.200,00', status: 'Pago', statusColor: 'bg-primary/10 text-heading dark:bg-primary/20 dark:text-primary' },
                { date: '22 Abr, 09:15', patient: 'Beatriz Nunes', service: 'Ortodontia', doc: 'Dra. Helena F.', value: 'R$ 180,00', status: 'Pendente', statusColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-xs">{row.date}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{row.patient}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{row.service}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{row.doc}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{row.value}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase", row.statusColor)}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
