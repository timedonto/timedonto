"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Users, DollarSign, Package, Clock, UserCheck, UserX, Crown, Shield, Stethoscope, Headphones, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ReportCard, ReportFilter, ExportButton, FilterValues } from '@/components/reports'
import { ExportColumn } from '@/lib/export-utils'

// Interfaces para os dados dos relatórios
interface AppointmentReportData {
  total: number
  byStatus: {
    SCHEDULED: number
    CONFIRMED: number
    CANCELED: number
    RESCHEDULED: number
    NO_SHOW: number
    DONE: number
  }
  byDentist: Array<{
    dentistId: string
    dentistName: string
    total: number
    done: number
    canceled: number
    noShow: number
  }>
  attendanceRate: number
  busiestDays: Array<{
    dayOfWeek: number
    count: number
  }>
  busiestHours: Array<{
    hour: number
    count: number
  }>
  thisMonth: number
  lastMonth: number
  upcoming: Array<{
    id: string
    date: string
    status: string
    procedure: string | null
    patientName: string
    dentistName: string
  }>
}

interface Dentist {
  id: string
  user: {
    name: string
  }
}

interface UserReportData {
  total: number
  active: number
  inactive: number
  byRole: {
    OWNER: number
    ADMIN: number
    DENTIST: number
    RECEPTIONIST: number
  }
  users: Array<{
    id: string
    name: string
    email: string
    role: 'OWNER' | 'ADMIN' | 'DENTIST' | 'RECEPTIONIST'
    isActive: boolean
    createdAt: string
  }>
}

interface PatientReportData {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  newLastMonth: number
  byMonth: Array<{
    month: string
    count: number
  }>
  patients: Array<{
    id: string
    name: string
    email: string | null
    phone: string | null
    cpf: string | null
    isActive: boolean
    createdAt: string
  }>
}

interface FinanceReportData {
  totalReceived: number
  byMethod: {
    CASH: number
    PIX: number
    CARD: number
  }
  byMonth: Array<{
    month: string
    total: number
    count: number
  }>
  dailyAverage: number
  paymentCount: number
  topPatients: Array<{
    patientId: string
    patientName: string
    total: number
    count: number
  }>
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('appointments')
  
  // Estados para relatório de agenda
  const [appointmentData, setAppointmentData] = useState<AppointmentReportData | null>(null)
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [appointmentLoading, setAppointmentLoading] = useState(false)
  const [appointmentFilters, setAppointmentFilters] = useState<FilterValues>({})

  // Estados para relatório de usuários
  const [userReportData, setUserReportData] = useState<UserReportData | null>(null)
  const [userReportLoading, setUserReportLoading] = useState(false)

  // Estados para relatório de pacientes
  const [patientReportData, setPatientReportData] = useState<PatientReportData | null>(null)
  const [patientReportLoading, setPatientReportLoading] = useState(false)

  // Estados para relatório financeiro
  const [financeReportData, setFinanceReportData] = useState<FinanceReportData | null>(null)
  const [financeReportLoading, setFinanceReportLoading] = useState(false)
  const [financeFilters, setFinanceFilters] = useState<{ fromDate: string; toDate: string }>({
    fromDate: '',
    toDate: ''
  })

  // Buscar lista de dentistas para o filtro
  const fetchDentists = async () => {
    try {
      const response = await fetch('/api/dentists')
      const data = await response.json()
      
      if (data.success) {
        setDentists(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar dentistas:', error)
    }
  }

  // Buscar dados do relatório de agenda
  const fetchAppointmentReport = async (filters: FilterValues = {}) => {
    try {
      setAppointmentLoading(true)
      
      const params = new URLSearchParams()
      if (filters.fromDate) params.append('from', new Date(filters.fromDate).toISOString())
      if (filters.toDate) params.append('to', new Date(filters.toDate).toISOString())
      if (filters.dentistId) params.append('dentistId', filters.dentistId)
      
      const url = `/api/reports/appointments${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setAppointmentData(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar relatório de agenda:', error)
    } finally {
      setAppointmentLoading(false)
    }
  }

  // Buscar dados do relatório de usuários
  const fetchUserReport = async () => {
    try {
      setUserReportLoading(true)
      
      const response = await fetch('/api/reports/users')
      const data = await response.json()
      
      if (data.success) {
        setUserReportData(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar relatório de usuários:', error)
    } finally {
      setUserReportLoading(false)
    }
  }

  // Buscar dados do relatório de pacientes
  const fetchPatientReport = async () => {
    try {
      setPatientReportLoading(true)
      
      const response = await fetch('/api/reports/patients')
      const data = await response.json()
      
      if (data.success) {
        setPatientReportData(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar relatório de pacientes:', error)
    } finally {
      setPatientReportLoading(false)
    }
  }

  // Buscar dados do relatório financeiro
  const fetchFinanceReport = async (filters: { fromDate: string; toDate: string } = financeFilters) => {
    try {
      setFinanceReportLoading(true)
      
      const params = new URLSearchParams()
      if (filters.fromDate) params.append('from', new Date(filters.fromDate).toISOString())
      if (filters.toDate) params.append('to', new Date(filters.toDate).toISOString())
      
      const url = `/api/reports/finance${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setFinanceReportData(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar relatório financeiro:', error)
    } finally {
      setFinanceReportLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    fetchDentists()
    fetchAppointmentReport()
  }, [])

  // Carregar dados de usuários quando a aba for selecionada
  useEffect(() => {
    if (activeTab === 'users' && !userReportData) {
      fetchUserReport()
    }
  }, [activeTab, userReportData])

  // Carregar dados de pacientes quando a aba for selecionada
  useEffect(() => {
    if (activeTab === 'patients' && !patientReportData) {
      fetchPatientReport()
    }
  }, [activeTab, patientReportData])

  // Carregar dados financeiros quando a aba for selecionada
  useEffect(() => {
    if (activeTab === 'finance' && !financeReportData) {
      fetchFinanceReport()
    }
  }, [activeTab, financeReportData])

  // Handler para filtros de agenda
  const handleAppointmentFilter = (filters: FilterValues) => {
    setAppointmentFilters(filters)
    fetchAppointmentReport(filters)
  }

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  // Formatar horário
  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  // Obter nome do dia da semana
  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    return days[dayOfWeek]
  }

  // Obter variante do badge por status
  const getStatusBadge = (status: string) => {
    const badges = {
      SCHEDULED: { variant: 'secondary' as const, label: 'Agendado' },
      CONFIRMED: { variant: 'default' as const, label: 'Confirmado' },
      DONE: { variant: 'default' as const, label: 'Atendido' },
      CANCELED: { variant: 'destructive' as const, label: 'Cancelado' },
      NO_SHOW: { variant: 'destructive' as const, label: 'Falta' },
      RESCHEDULED: { variant: 'secondary' as const, label: 'Remarcado' }
    }
    return badges[status as keyof typeof badges] || { variant: 'secondary' as const, label: status }
  }

  // Verificar se usuário pode ver dados de todos os dentistas
  const canViewAllDentists = session?.user?.role === 'OWNER' || session?.user?.role === 'ADMIN'

  // Colunas para exportação de agendamentos
  const appointmentExportColumns: ExportColumn[] = [
    { key: 'dentistName', header: 'Dentista', type: 'string' },
    { key: 'total', header: 'Total', type: 'number' },
    { key: 'done', header: 'Atendidos', type: 'number' },
    { key: 'canceled', header: 'Cancelados', type: 'number' },
    { key: 'noShow', header: 'Faltas', type: 'number' }
  ]

  // Colunas para exportação de próximos agendamentos
  const upcomingAppointmentsColumns: ExportColumn[] = [
    { key: 'date', header: 'Data', type: 'date' },
    { key: 'patientName', header: 'Paciente', type: 'string' },
    { key: 'dentistName', header: 'Dentista', type: 'string' },
    { key: 'status', header: 'Status', type: 'string' },
    { key: 'procedure', header: 'Procedimento', type: 'string' }
  ]

  // Calcular tendências para os cards
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { trend: 'neutral' as const, value: '0%' }
    const percentage = ((current - previous) / previous) * 100
    const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral'
    return { trend, value: `${Math.abs(percentage).toFixed(1)}%` }
  }

  // Obter badge e ícone por role
  const getRoleBadge = (role: string) => {
    const badges = {
      OWNER: { variant: 'default' as const, label: 'Owner', icon: Crown, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      ADMIN: { variant: 'default' as const, label: 'Admin', icon: Shield, color: 'bg-purple-100 text-purple-800 border-purple-200' },
      DENTIST: { variant: 'default' as const, label: 'Dentista', icon: Stethoscope, color: 'bg-blue-100 text-blue-800 border-blue-200' },
      RECEPTIONIST: { variant: 'default' as const, label: 'Recepcionista', icon: Headphones, color: 'bg-green-100 text-green-800 border-green-200' }
    }
    return badges[role as keyof typeof badges] || { variant: 'secondary' as const, label: role, icon: Users, color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  // Obter badge de status
  const getUserStatusBadge = (isActive: boolean) => {
    return isActive 
      ? { variant: 'default' as const, label: 'Ativo', color: 'bg-green-100 text-green-800 border-green-200' }
      : { variant: 'secondary' as const, label: 'Inativo', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  // Colunas para exportação de usuários
  const userExportColumns: ExportColumn[] = [
    { key: 'name', header: 'Nome', type: 'string' },
    { key: 'email', header: 'Email', type: 'string' },
    { key: 'role', header: 'Cargo', type: 'string' },
    { key: 'isActive', header: 'Status', type: 'boolean' },
    { key: 'createdAt', header: 'Data Cadastro', type: 'date' }
  ]

  // Colunas para exportação de pacientes
  const patientExportColumns: ExportColumn[] = [
    { key: 'name', header: 'Nome', type: 'string' },
    { key: 'email', header: 'Email', type: 'string' },
    { key: 'phone', header: 'Telefone', type: 'string' },
    { key: 'cpf', header: 'CPF', type: 'string' },
    { key: 'isActive', header: 'Status', type: 'boolean' },
    { key: 'createdAt', header: 'Data Cadastro', type: 'date' }
  ]

  // Formatar CPF
  const formatCPF = (cpf: string | null): string => {
    if (!cpf) return '-'
    // Remove caracteres não numéricos
    const numbers = cpf.replace(/\D/g, '')
    // Aplica a máscara ###.###.###-##
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cpf
  }

  // Formatar telefone
  const formatPhone = (phone: string | null): string => {
    if (!phone) return '-'
    // Remove caracteres não numéricos
    const numbers = phone.replace(/\D/g, '')
    // Aplica a máscara (##) #####-#### ou (##) ####-####
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  // Formatar valor monetário em BRL
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Colunas para exportação de dados financeiros (top pacientes)
  const financeExportColumns: ExportColumn[] = [
    { key: 'patientName', header: 'Paciente', type: 'string' },
    { key: 'total', header: 'Total Pago', type: 'number' },
    { key: 'count', header: 'Qtd Pagamentos', type: 'number' }
  ]

  // Handler para filtros financeiros
  const handleFinanceFilter = () => {
    fetchFinanceReport(financeFilters)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Relatórios e análises da clínica
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agenda
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pacientes
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Estoque
          </TabsTrigger>
        </TabsList>

        {/* Aba de Agenda */}
        <TabsContent value="appointments" className="space-y-6">
          {/* Filtros */}
          <ReportFilter
            onFilter={handleAppointmentFilter}
            showDateRange={true}
            showDentist={canViewAllDentists}
            dentists={dentists}
            initialValues={appointmentFilters}
          />

          {appointmentData && (
            <>
              {/* Cards de resumo */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ReportCard
                  title="Total de Agendamentos"
                  value={appointmentData.total}
                  icon={Calendar}
                />

                <ReportCard
                  title="Taxa de Comparecimento"
                  value={`${appointmentData.attendanceRate}%`}
                  icon={Clock}
                  description="Baseado em agendamentos finalizados"
                />

                <ReportCard
                  title="Este Mês"
                  value={appointmentData.thisMonth}
                  icon={Calendar}
                  {...(appointmentData.lastMonth > 0 && {
                    ...getTrend(appointmentData.thisMonth, appointmentData.lastMonth),
                    trendValue: getTrend(appointmentData.thisMonth, appointmentData.lastMonth).value
                  })}
                />

                <ReportCard
                  title="Mês Anterior"
                  value={appointmentData.lastMonth}
                  icon={Calendar}
                  description="Para comparação"
                />
              </div>

              {/* Cards por status */}
              <Card>
                <CardHeader>
                  <CardTitle>Por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2">Agendados</Badge>
                      <div className="text-2xl font-bold">{appointmentData.byStatus.SCHEDULED}</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="default" className="mb-2">Confirmados</Badge>
                      <div className="text-2xl font-bold">{appointmentData.byStatus.CONFIRMED}</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="default" className="mb-2">Atendidos</Badge>
                      <div className="text-2xl font-bold">{appointmentData.byStatus.DONE}</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="destructive" className="mb-2">Cancelados</Badge>
                      <div className="text-2xl font-bold">{appointmentData.byStatus.CANCELED}</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="destructive" className="mb-2">Faltas</Badge>
                      <div className="text-2xl font-bold">{appointmentData.byStatus.NO_SHOW}</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2">Remarcados</Badge>
                      <div className="text-2xl font-bold">{appointmentData.byStatus.RESCHEDULED}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Por Dentista */}
              {appointmentData.byDentist.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Por Dentista</CardTitle>
                    <ExportButton
                      data={appointmentData.byDentist}
                      columns={appointmentExportColumns}
                      filename="agendamentos_por_dentista"
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dentista</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Atendidos</TableHead>
                          <TableHead>Cancelados</TableHead>
                          <TableHead>Faltas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointmentData.byDentist.map((dentist) => (
                          <TableRow key={dentist.dentistId}>
                            <TableCell className="font-medium">{dentist.dentistName}</TableCell>
                            <TableCell>{dentist.total}</TableCell>
                            <TableCell>{dentist.done}</TableCell>
                            <TableCell>{dentist.canceled}</TableCell>
                            <TableCell>{dentist.noShow}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Horários Mais Movimentados */}
              {appointmentData.busiestHours.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Horários Mais Movimentados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {appointmentData.busiestHours.slice(0, 10).map((hour) => (
                        <div key={hour.hour} className="flex justify-between items-center">
                          <span>{formatHour(hour.hour)}</span>
                          <Badge variant="outline">{hour.count} agendamentos</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Próximos Agendamentos */}
              {appointmentData.upcoming.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Próximos Agendamentos</CardTitle>
                    <ExportButton
                      data={appointmentData.upcoming}
                      columns={upcomingAppointmentsColumns}
                      filename="proximos_agendamentos"
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Dentista</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointmentData.upcoming.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">
                              {formatDate(appointment.date)}
                            </TableCell>
                            <TableCell>{appointment.patientName}</TableCell>
                            <TableCell>{appointment.dentistName}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadge(appointment.status).variant}>
                                {getStatusBadge(appointment.status).label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {appointmentLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Carregando relatório...</div>
            </div>
          )}
        </TabsContent>

        {/* Aba de Usuários */}
        <TabsContent value="users" className="space-y-6">
          {userReportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando relatório de usuários...
              </div>
            </div>
          ) : userReportData ? (
            <>
              {/* Cards de resumo */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <ReportCard
                  title="Total de Usuários"
                  value={userReportData.total}
                  icon={Users}
                />

                <ReportCard
                  title="Usuários Ativos"
                  value={userReportData.active}
                  icon={UserCheck}
                  description={`${((userReportData.active / userReportData.total) * 100).toFixed(1)}% do total`}
                />

                <ReportCard
                  title="Usuários Inativos"
                  value={userReportData.inactive}
                  icon={UserX}
                  description={`${((userReportData.inactive / userReportData.total) * 100).toFixed(1)}% do total`}
                />
              </div>

              {/* Cards por role */}
              <Card>
                <CardHeader>
                  <CardTitle>Por Cargo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 rounded-lg border bg-yellow-50">
                      <div className="flex items-center justify-center mb-2">
                        <Crown className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="text-2xl font-bold text-yellow-800">{userReportData.byRole.OWNER}</div>
                      <div className="text-sm text-yellow-600">Owners</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg border bg-purple-50">
                      <div className="flex items-center justify-center mb-2">
                        <Shield className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-purple-800">{userReportData.byRole.ADMIN}</div>
                      <div className="text-sm text-purple-600">Admins</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg border bg-blue-50">
                      <div className="flex items-center justify-center mb-2">
                        <Stethoscope className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-800">{userReportData.byRole.DENTIST}</div>
                      <div className="text-sm text-blue-600">Dentistas</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg border bg-green-50">
                      <div className="flex items-center justify-center mb-2">
                        <Headphones className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-800">{userReportData.byRole.RECEPTIONIST}</div>
                      <div className="text-sm text-green-600">Recepcionistas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de usuários */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Lista de Usuários</CardTitle>
                  <ExportButton
                    data={userReportData.users}
                    columns={userExportColumns}
                    filename="relatorio_usuarios"
                  />
                </CardHeader>
                <CardContent>
                  {userReportData.users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data Cadastro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userReportData.users.map((user) => {
                          const roleBadge = getRoleBadge(user.role)
                          const statusBadge = getUserStatusBadge(user.isActive)
                          const RoleIcon = roleBadge.icon
                          
                          return (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell className="text-muted-foreground">{user.email}</TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${roleBadge.color}`}>
                                  <RoleIcon className="h-3 w-3" />
                                  {roleBadge.label}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusBadge.color}`}>
                                  {statusBadge.label}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Erro ao carregar relatório</h3>
                <p className="text-muted-foreground">Não foi possível carregar os dados dos usuários</p>
              </div>
              <Button onClick={fetchUserReport} variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Aba de Pacientes */}
        <TabsContent value="patients" className="space-y-6">
          {patientReportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando relatório de pacientes...
              </div>
            </div>
          ) : patientReportData ? (
            <>
              {/* Cards de resumo */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <ReportCard
                  title="Total de Pacientes"
                  value={patientReportData.total}
                  icon={Users}
                />

                <ReportCard
                  title="Pacientes Ativos"
                  value={patientReportData.active}
                  icon={UserCheck}
                  description={`${patientReportData.total > 0 ? ((patientReportData.active / patientReportData.total) * 100).toFixed(1) : 0}% do total`}
                />

                <ReportCard
                  title="Pacientes Inativos"
                  value={patientReportData.inactive}
                  icon={UserX}
                  description={`${patientReportData.total > 0 ? ((patientReportData.inactive / patientReportData.total) * 100).toFixed(1) : 0}% do total`}
                />

                <ReportCard
                  title="Novos Este Mês"
                  value={patientReportData.newThisMonth}
                  icon={Calendar}
                  {...(patientReportData.newLastMonth > 0 && {
                    ...getTrend(patientReportData.newThisMonth, patientReportData.newLastMonth),
                    trendValue: getTrend(patientReportData.newThisMonth, patientReportData.newLastMonth).value
                  })}
                />

                <ReportCard
                  title="Novos Mês Anterior"
                  value={patientReportData.newLastMonth}
                  icon={Calendar}
                  description="Para comparação"
                />
              </div>

              {/* Tabela de pacientes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Lista de Pacientes</CardTitle>
                  <ExportButton
                    data={patientReportData.patients}
                    columns={patientExportColumns}
                    filename="relatorio_pacientes"
                  />
                </CardHeader>
                <CardContent>
                  {patientReportData.patients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum paciente encontrado
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data Cadastro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientReportData.patients.map((patient) => {
                          const statusBadge = getUserStatusBadge(patient.isActive)
                          
                          return (
                            <TableRow key={patient.id}>
                              <TableCell className="font-medium">{patient.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {patient.email || '-'}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatPhone(patient.phone)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatCPF(patient.cpf)}
                              </TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusBadge.color}`}>
                                  {statusBadge.label}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(patient.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Erro ao carregar relatório</h3>
                <p className="text-muted-foreground">Não foi possível carregar os dados dos pacientes</p>
              </div>
              <Button onClick={fetchPatientReport} variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Aba de Financeiro */}
        <TabsContent value="finance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Em desenvolvimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Data início:</label>
                  <Input
                    type="date"
                    value={financeFilters.fromDate}
                    onChange={(e) => setFinanceFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="w-[150px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Data fim:</label>
                  <Input
                    type="date"
                    value={financeFilters.toDate}
                    onChange={(e) => setFinanceFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    className="w-[150px]"
                  />
                </div>

                <Button onClick={handleFinanceFilter} size="sm">
                  Filtrar
                </Button>

                {(financeFilters.fromDate || financeFilters.toDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFinanceFilters({ fromDate: '', toDate: '' })
                      fetchFinanceReport({ fromDate: '', toDate: '' })
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {financeReportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando relatório financeiro...
              </div>
            </div>
          ) : financeReportData ? (
            <>
              {/* Cards de resumo */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <ReportCard
                  title="Total Recebido"
                  value={formatCurrency(financeReportData.totalReceived)}
                  icon={DollarSign}
                />

                <ReportCard
                  title="Dinheiro"
                  value={formatCurrency(financeReportData.byMethod.CASH)}
                  icon={DollarSign}
                  description="Pagamentos em dinheiro"
                />

                <ReportCard
                  title="PIX"
                  value={formatCurrency(financeReportData.byMethod.PIX)}
                  icon={DollarSign}
                  description="Pagamentos via PIX"
                />

                <ReportCard
                  title="Cartão"
                  value={formatCurrency(financeReportData.byMethod.CARD)}
                  icon={DollarSign}
                  description="Pagamentos no cartão"
                />

                <ReportCard
                  title="Qtd Pagamentos"
                  value={financeReportData.paymentCount}
                  icon={Clock}
                  description="Total de transações"
                />

                <ReportCard
                  title="Média Diária"
                  value={formatCurrency(financeReportData.dailyAverage)}
                  icon={DollarSign}
                  description="Baseado no período"
                />
              </div>

              {/* Top 5 Pacientes */}
              {financeReportData.topPatients.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Top 5 Pacientes</CardTitle>
                    <ExportButton
                      data={financeReportData.topPatients}
                      columns={financeExportColumns}
                      filename="top_pacientes_financeiro"
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Posição</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Total Pago</TableHead>
                          <TableHead>Qtd Pagamentos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financeReportData.topPatients.map((patient, index) => (
                          <TableRow key={patient.patientId}>
                            <TableCell className="font-medium">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{patient.patientName}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(patient.total)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {patient.count} pagamento{patient.count !== 1 ? 's' : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Erro ao carregar relatório</h3>
                <p className="text-muted-foreground">Não foi possível carregar os dados financeiros</p>
              </div>
              <Button onClick={() => fetchFinanceReport()} variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Estoque</CardTitle>
              <CardDescription>Em desenvolvimento</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}