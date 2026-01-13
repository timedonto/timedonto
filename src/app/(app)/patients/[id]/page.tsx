"use client"

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Pencil, Loader2, Calendar, FileText, DollarSign, Plus, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentStatus, UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PatientFormModal } from '@/components/patients/patient-form-modal'
import { RecordFormModal } from '@/components/records/record-form-modal'

interface Patient {
  id: string
  clinicId: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  birthDate: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  data?: Patient
  error?: string
}

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

interface AppointmentsApiResponse {
  success: boolean
  data?: AppointmentApiData[]
  error?: string
}

interface RecordApiData {
  id: string
  clinicId: string
  patientId: string
  dentistId: string
  appointmentId: string | null
  description: string
  procedures: string | null
  odontogram: string | null
  createdAt: string
  updatedAt: string
  patient: {
    id: string
    name: string
  }
  dentist: {
    id: string
    specialty: string | null
    user: {
      id: string
      name: string
    }
  }
  appointment: {
    id: string
    date: string
  } | null
}

interface RecordsApiResponse {
  success: boolean
  data?: RecordApiData[]
  error?: string
}

interface PatientDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function PatientDetailsPage({ params }: PatientDetailsPageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { id } = use(params)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('agenda')
  
  // Estados para agendamentos
  const [appointments, setAppointments] = useState<AppointmentApiData[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)

  // Estados para prontuários
  const [records, setRecords] = useState<RecordApiData[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)

  // Buscar dados do paciente
  const fetchPatient = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/patients/${id}`)
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError('Paciente não encontrado')
        } else {
          throw new Error(data.error || 'Erro ao carregar paciente')
        }
        return
      }

      if (data.success && data.data) {
        setPatient(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar paciente:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar paciente')
    } finally {
      setLoading(false)
    }
  }, [id])

  // Carregar paciente ao montar o componente
  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])

  // Handlers
  const handleBack = () => {
    router.push('/patients')
  }

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchPatient() // Recarregar dados após edição
  }

  // Buscar agendamentos do paciente
  const fetchAppointments = useCallback(async () => {
    try {
      setLoadingAppointments(true)
      setAppointmentsError(null)

      const response = await fetch(`/api/appointments?patientId=${id}`)
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
      }

      const data: AppointmentsApiResponse = await response.json()

      if (data.success && data.data) {
        setAppointments(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido ao buscar agendamentos')
      }
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar agendamentos'
      setAppointmentsError(errorMessage)
    } finally {
      setLoadingAppointments(false)
    }
  }, [id])

  // Carregar agendamentos quando a aba agenda for ativada
  useEffect(() => {
    if (activeTab === 'agenda' && patient) {
      fetchAppointments()
    }
  }, [activeTab, patient, fetchAppointments])

  const handleNewAppointment = () => {
    // TODO: Implementar abertura do modal com patientId pré-selecionado
    console.log('Novo agendamento para paciente:', id)
  }

  // Buscar prontuários do paciente
  const fetchRecords = useCallback(async () => {
    try {
      setLoadingRecords(true)
      setRecordsError(null)

      const response = await fetch(`/api/patients/${id}/records`)
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
      }

      const data: RecordsApiResponse = await response.json()

      if (data.success && data.data) {
        setRecords(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido ao buscar prontuários')
      }
    } catch (err) {
      console.error('Erro ao buscar prontuários:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar prontuários'
      setRecordsError(errorMessage)
    } finally {
      setLoadingRecords(false)
    }
  }, [id])

  // Verificar se o usuário pode ver prontuários (não é RECEPTIONIST)
  const canViewRecords = session?.user?.role !== UserRole.RECEPTIONIST

  // Carregar prontuários quando a aba prontuário for ativada
  useEffect(() => {
    if (activeTab === 'prontuario' && patient && canViewRecords) {
      fetchRecords()
    }
  }, [activeTab, patient, canViewRecords, fetchRecords])

  const handleNewRecord = () => {
    console.log("Abrindo modal de prontuário")
    setRecordModalOpen(true)
  }

  const handleViewRecord = (recordId: string) => {
    router.push(`/records/${recordId}`)
  }

  // Truncar descrição para exibição na lista
  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength) + '...'
  }

  // Formatadores
  const formatCpf = (cpf: string | null) => {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return '-'
    }
  }

  // Configuração de cores para status de agendamento
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

  // Labels para status de agendamento
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

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando dados do paciente...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erro ao carregar paciente</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBack} variant="outline">
            Voltar para lista
          </Button>
          <Button onClick={fetchPatient}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Paciente não encontrado</h3>
          <p className="text-muted-foreground">
            O paciente que você está procurando não existe ou foi removido
          </p>
        </div>
        <Button onClick={handleBack} variant="outline">
          Voltar para lista
        </Button>
      </div>
    )
  }

  // Configurar abas baseado nas permissões do usuário
  const tabs = [
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'orcamentos', label: 'Orçamentos', icon: DollarSign },
    ...(canViewRecords ? [{ id: 'prontuario', label: 'Prontuário', icon: FileText }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para lista
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
            <Badge variant={patient.isActive ? 'success' : 'destructive'}>
              {patient.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
        <Button onClick={handleEdit} className="flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Cards com informações */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-sm">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm">{formatCpf(patient.cpf)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
              <p className="text-sm">{formatDate(patient.birthDate)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{patient.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="text-sm">{formatPhone(patient.phone)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Endereço</p>
              <p className="text-sm">{patient.address || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {patient.notes && (
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Seção de Abas */}
      <div className="space-y-4">
        {/* Navegação das abas */}
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Conteúdo das abas */}
        <Card>
          <CardContent className="pt-6">
            {activeTab === 'agenda' && (
              <div className="space-y-4">
                {/* Header da aba Agenda */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Agendamentos</h3>
                  <Button onClick={handleNewAppointment} size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Agendamento
                  </Button>
                </div>

                {/* Lista de agendamentos */}
                {loadingAppointments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando agendamentos...
                    </div>
                  </div>
                ) : appointmentsError ? (
                  <div className="text-center py-8">
                    <div className="text-center">
                      <h4 className="text-md font-semibold text-destructive mb-2">Erro ao carregar agendamentos</h4>
                      <p className="text-muted-foreground mb-4">{appointmentsError}</p>
                      <Button onClick={fetchAppointments} variant="outline" size="sm">
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-md font-semibold mb-2">Nenhum agendamento encontrado</h4>
                    <p className="text-muted-foreground mb-4">
                      Este paciente ainda não possui agendamentos
                    </p>
                    <Button onClick={handleNewAppointment} size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Primeiro Agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Dentista</TableHead>
                          <TableHead>Procedimento</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>
                                  {format(new Date(appointment.date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(appointment.date), "HH:mm", { locale: ptBR })} 
                                  ({appointment.durationMinutes}min)
                                </span>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orcamentos' && (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Orçamentos</h3>
                <p className="text-muted-foreground">
                  Orçamentos serão implementados na Sprint 6
                </p>
              </div>
            )}

            {activeTab === 'prontuario' && canViewRecords && (
              <div className="space-y-4">
                {/* Header da aba Prontuário */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Prontuário Médico</h3>
                  <Button onClick={handleNewRecord} size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Registro
                  </Button>
                </div>

                {/* Lista de prontuários */}
                {loadingRecords ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando prontuários...
                    </div>
                  </div>
                ) : recordsError ? (
                  <div className="text-center py-8">
                    <div className="text-center">
                      <h4 className="text-md font-semibold text-destructive mb-2">Erro ao carregar prontuários</h4>
                      <p className="text-muted-foreground mb-4">{recordsError}</p>
                      <Button onClick={fetchRecords} variant="outline" size="sm">
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-md font-semibold mb-2">Nenhum registro encontrado</h4>
                    <p className="text-muted-foreground mb-4">
                      Este paciente ainda não possui registros no prontuário
                    </p>
                    <Button onClick={handleNewRecord} size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Primeiro Registro
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {records.map((record) => (
                      <Card key={record.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="font-medium">
                                  {format(new Date(record.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                                <span>•</span>
                                <span>Dr(a). {record.dentist.user.name}</span>
                                {record.dentist.specialty && (
                                  <>
                                    <span>•</span>
                                    <span>{record.dentist.specialty}</span>
                                  </>
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Descrição:</p>
                                <p className="text-sm text-muted-foreground">
                                  {truncateDescription(record.description)}
                                </p>
                              </div>
                              {record.appointment && (
                                <div className="text-xs text-muted-foreground">
                                  Relacionado ao agendamento de {format(new Date(record.appointment.date), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleViewRecord(record.id)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 ml-4"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de edição */}
      <PatientFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        patient={patient}
        onSuccess={handleEditSuccess}
      />

      {/* Modal de novo prontuário */}
      <RecordFormModal
        open={recordModalOpen}
        onOpenChange={setRecordModalOpen}
        patientId={id}
        onSuccess={() => {
          setRecordModalOpen(false)
          fetchRecords()
        }}
      />
    </div>
  )
}