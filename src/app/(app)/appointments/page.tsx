"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Loader2, Calendar, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentStatus } from '@prisma/client'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppointmentOutput } from '@/modules/appointments/domain/appointment.schema'
import { AppointmentFormModal } from '@/components/appointments/appointment-form-modal'

// Interface para dados da API (com datas como strings)
interface AppointmentApiData {
  id: string
  clinicId: string
  dentistId: string
  patientId: string
  date: string
  durationMinutes: number
  status: AppointmentStatus
  procedure: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  dentist: {
    id: string
    cro: string
    specialty: string | null
    user: {
      id: string
      name: string
      email: string
    }
  }
  patient: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
}

// Interface para dentistas da API
interface DentistApiData {
  id: string
  cro: string
  specialty: string | null
  user: {
    id: string
    name: string
    email: string
    isActive: boolean
  }
}

// Converter dados da API para AppointmentOutput
const convertApiDataToAppointment = (apiData: AppointmentApiData): AppointmentOutput => ({
  ...apiData,
  date: new Date(apiData.date),
  createdAt: new Date(apiData.createdAt),
  updatedAt: new Date(apiData.updatedAt),
})

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Configuração de cores para status
const getStatusBadgeVariant = (status: AppointmentStatus) => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return 'default'
    case AppointmentStatus.CONFIRMED:
      return 'success'
    case AppointmentStatus.CANCELED:
      return 'destructive'
    case AppointmentStatus.RESCHEDULED:
      return 'secondary'
    case AppointmentStatus.NO_SHOW:
      return 'warning'
    case AppointmentStatus.DONE:
      return 'success'
    default:
      return 'default'
  }
}

// Labels para status
const getStatusLabel = (status: AppointmentStatus) => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return 'Agendado'
    case AppointmentStatus.CONFIRMED:
      return 'Confirmado'
    case AppointmentStatus.CANCELED:
      return 'Cancelado'
    case AppointmentStatus.RESCHEDULED:
      return 'Reagendado'
    case AppointmentStatus.NO_SHOW:
      return 'Não Compareceu'
    case AppointmentStatus.DONE:
      return 'Concluído'
    default:
      return status
  }
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<AppointmentOutput[]>([])
  const [dentists, setDentists] = useState<DentistApiData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDentists, setLoadingDentists] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentOutput | undefined>(undefined)
  
  // Filtros
  const [selectedDentist, setSelectedDentist] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Construir query params baseado nos filtros
  const buildQueryParams = () => {
    const params = new URLSearchParams()
    
    if (selectedDentist && selectedDentist !== 'all') {
      params.append('dentistId', selectedDentist)
    }
    
    if (selectedDate) {
      params.append('date', selectedDate)
    }
    
    if (selectedStatus && selectedStatus !== 'all') {
      params.append('status', selectedStatus)
    }
    
    return params.toString()
  }

  // Carregar dentistas
  const fetchDentists = async () => {
    try {
      setLoadingDentists(true)
      const response = await fetch('/api/dentists')
      const data: ApiResponse<DentistApiData[]> = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar dentistas')
      }

      if (data.success && data.data) {
        setDentists(data.data.filter(dentist => dentist.user.isActive))
      }
    } catch (err) {
      console.error('Erro ao buscar dentistas:', err)
    } finally {
      setLoadingDentists(false)
    }
  }

  // Carregar agendamentos
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = buildQueryParams()
      const url = `/api/appointments${queryParams ? `?${queryParams}` : ''}`
      
      const response = await fetch(url)
      const data: ApiResponse<AppointmentApiData[]> = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar agendamentos')
      }

      if (data.success && data.data) {
        const convertedAppointments = data.data.map(convertApiDataToAppointment)
        setAppointments(convertedAppointments)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    fetchDentists()
  }, [])

  // Recarregar agendamentos quando filtros mudarem
  useEffect(() => {
    fetchAppointments()
  }, [selectedDentist, selectedDate, selectedStatus])

  // Handlers para ações
  const handleCreateAppointment = () => {
    setSelectedAppointment(undefined)
    setIsModalOpen(true)
  }

  const handleEditAppointment = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId)
    if (appointment) {
      setSelectedAppointment(appointment)
      setIsModalOpen(true)
    }
  }

  const handleAppointmentClick = (appointmentId: string) => {
    // TODO: Implementar página de detalhes do agendamento
    console.log('Ver agendamento:', appointmentId)
  }

  const handleModalSuccess = () => {
    fetchAppointments()
  }

  // Limpar filtros
  const clearFilters = () => {
    setSelectedDentist('all')
    setSelectedDate('')
    setSelectedStatus('all')
  }

  // Verificar se há filtros ativos
  const hasActiveFilters = (selectedDentist && selectedDentist !== 'all') || selectedDate || (selectedStatus && selectedStatus !== 'all')

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos da clínica
          </p>
        </div>
        <Button onClick={handleCreateAppointment} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 text-xs"
            >
              Limpar
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Dentista */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Dentista</label>
            <Select value={selectedDentist} onValueChange={setSelectedDentist}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os dentistas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dentistas</SelectItem>
                {dentists.map((dentist) => (
                  <SelectItem key={dentist.id} value={dentist.id}>
                    {dentist.user.name} - {dentist.cro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filtro por Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value={AppointmentStatus.SCHEDULED}>Agendado</SelectItem>
                <SelectItem value={AppointmentStatus.CONFIRMED}>Confirmado</SelectItem>
                <SelectItem value={AppointmentStatus.CANCELED}>Cancelado</SelectItem>
                <SelectItem value={AppointmentStatus.RESCHEDULED}>Reagendado</SelectItem>
                <SelectItem value={AppointmentStatus.NO_SHOW}>Não Compareceu</SelectItem>
                <SelectItem value={AppointmentStatus.DONE}>Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="rounded-md border">
        {loading ? (
          // Estado de loading
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando agendamentos...
            </div>
          </div>
        ) : error ? (
          // Estado de erro
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Erro ao carregar agendamentos</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchAppointments} variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : appointments.length === 0 ? (
          // Estado vazio
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                {hasActiveFilters ? 'Nenhum agendamento encontrado' : 'Nenhum agendamento cadastrado'}
              </h3>
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? 'Tente ajustar os filtros para encontrar agendamentos'
                  : 'Comece criando o primeiro agendamento da clínica'
                }
              </p>
            </div>
            {!hasActiveFilters && (
              <Button onClick={handleCreateAppointment} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Agendamento
              </Button>
            )}
          </div>
        ) : (
          // Tabela de agendamentos
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Dentista</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow 
                  key={appointment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleAppointmentClick(appointment.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>
                        {format(appointment.date, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(appointment.date, "HH:mm", { locale: ptBR })} 
                        ({appointment.durationMinutes}min)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{appointment.patient.name}</span>
                      {appointment.patient.phone && (
                        <span className="text-sm text-muted-foreground">
                          {appointment.patient.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{appointment.dentist.user.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {appointment.dentist.cro}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {appointment.procedure || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(appointment.status)}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditAppointment(appointment.id)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar agendamento</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de criar/editar agendamento */}
      <AppointmentFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        appointment={selectedAppointment}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}