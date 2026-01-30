"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Pencil, Loader2, Calendar, FileText, DollarSign, Plus, Eye, Receipt, Clock } from 'lucide-react'
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
import type { PatientOutput } from '@/modules/patients/domain/patient.schema'
import { RecordFormModal } from '@/components/records/record-form-modal'
import { TreatmentPlanFormModal } from '@/components/treatment-plans/treatment-plan-form-modal'
import { PaymentFormModal } from '@/components/finance/payment-form-modal'
import { AppointmentFormModal } from '@/components/appointments/appointment-form-modal'

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

interface TreatmentPlanApiData {
  id: string
  clinicId: string
  patientId: string
  dentistId: string
  status: 'OPEN' | 'APPROVED' | 'REJECTED'
  totalAmount: number
  discountType: 'PERCENTAGE' | 'FIXED' | null
  discountValue: number | null
  finalAmount: number
  notes: string | null
  createdAt: string
  updatedAt: string
  items: {
    id: string
    planId: string
    procedureId: string | null
    description: string
    tooth: string | null
    value: number
    quantity: number
  }[]
  patient?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  dentist?: {
    id: string
    cro: string
    specialty: string | null
    user: {
      id: string
      name: string
      email: string
    }
  }
}

interface TreatmentPlansApiResponse {
  success: boolean
  data?: TreatmentPlanApiData[]
  error?: string
}

interface PaymentApiData {
  id: string
  clinicId: string
  patientId: string | null
  originalAmount: number
  discountType: 'PERCENTAGE' | 'FIXED' | null
  discountValue: number | null
  amount: number
  method: 'CASH' | 'PIX' | 'CARD'
  description: string | null
  createdAt: string
  patient?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
}

interface PaymentsApiResponse {
  success: boolean
  data?: PaymentApiData[]
  error?: string
}

interface PatientDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function PatientDetailsPage({ params }: PatientDetailsPageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const routerParams = useParams()

  // Estado para o ID do paciente
  const [patientId, setPatientId] = useState<string | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [treatmentPlanModalOpen, setTreatmentPlanModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('agenda')

  // Estados para agendamentos
  const [appointments, setAppointments] = useState<AppointmentApiData[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)

  // Estados para prontuários
  const [records, setRecords] = useState<RecordApiData[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)

  // Estados para orçamentos
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlanApiData[]>([])
  const [loadingTreatmentPlans, setLoadingTreatmentPlans] = useState(false)
  const [treatmentPlansError, setTreatmentPlansError] = useState<string | null>(null)

  // Estados para pagamentos
  const [payments, setPayments] = useState<PaymentApiData[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)

  // Estados para atendimentos
  const [attendances, setAttendances] = useState<any[]>([])
  const [loadingAttendances, setLoadingAttendances] = useState(false)
  const [attendancesError, setAttendancesError] = useState<string | null>(null)

  // Extrair ID dos parâmetros - Testando múltiplas abordagens
  useEffect(() => {
    const extractParams = async () => {
      // Método 1: useParams (síncrono)
      const routerId = routerParams.id as string
      console.log('🔍 PARAMS DEBUG - useParams ID:', routerId) // Debug

      // Método 2: params Promise (assíncrono)
      const resolvedParams = await params
      console.log('🔍 PARAMS DEBUG - Promise params ID:', resolvedParams.id) // Debug

      // Método 3: URL atual
      console.log('🔍 PARAMS DEBUG - URL atual:', window.location.href) // Debug
      const urlParts = window.location.pathname.split('/')
      const urlId = urlParts[urlParts.length - 1]
      console.log('🔍 PARAMS DEBUG - ID da URL:', urlId) // Debug

      // Usar o ID do useParams se disponível, senão usar o da Promise
      const finalId = routerId || resolvedParams.id
      console.log('🔍 PARAMS DEBUG - ID final escolhido:', finalId) // Debug

      setPatientId(finalId)
    }
    extractParams()
  }, [params, routerParams])

  // Buscar dados do paciente
  const fetchPatient = useCallback(async () => {
    if (!patientId) return

    try {
      setLoading(true)
      setError(null)

      console.log('🚀 FETCH DEBUG - ID sendo usado:', patientId) // Debug
      console.log('🚀 FETCH DEBUG - URL completa:', `/api/patients/${patientId}`) // Debug

      const response = await fetch(`/api/patients/${patientId}`, {
        cache: 'no-store', // Evitar cache
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const data: ApiResponse = await response.json()

      console.log('🚀 FETCH DEBUG - Status da resposta:', response.status) // Debug
      console.log('🚀 FETCH DEBUG - Dados recebidos:', data) // Debug

      if (!response.ok) {
        if (response.status === 404) {
          setError('Paciente não encontrado')
        } else {
          throw new Error(data.error || 'Erro ao carregar paciente')
        }
        return
      }

      if (data.success && data.data) {
        console.log('✅ PACIENTE CARREGADO - Nome:', data.data.name) // Debug
        console.log('✅ PACIENTE CARREGADO - ID:', data.data.id) // Debug
        console.log('✅ PACIENTE CARREGADO - Dados completos:', data.data) // Debug
        setPatient(data.data)
      } else {
        console.log('❌ ERRO - Dados não encontrados:', data) // Debug
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar paciente:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar paciente')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  // Limpar dados quando o ID muda e carregar novo paciente
  useEffect(() => {
    if (patientId) {
      // Limpar dados anteriores
      setPatient(null)
      setAppointments([])
      setRecords([])
      setTreatmentPlans([])
      setPayments([])
      setError(null)

      console.log('🔄 RESET - Limpando dados anteriores e carregando ID:', patientId) // Debug
      fetchPatient()
    }
  }, [patientId, fetchPatient])

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
    if (!patientId) return

    try {
      setLoadingAppointments(true)
      setAppointmentsError(null)

      const response = await fetch(`/api/appointments?patientId=${patientId}`, {
        cache: 'no-store'
      })

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
  }, [patientId])

  // Carregar agendamentos quando a aba agenda for ativada
  useEffect(() => {
    if (activeTab === 'agenda' && patient) {
      fetchAppointments()
    }
  }, [activeTab, patient, fetchAppointments])

  const handleNewAppointment = () => {
    setAppointmentModalOpen(true)
  }

  // Buscar prontuários do paciente
  const fetchRecords = useCallback(async () => {
    if (!patientId) return

    try {
      setLoadingRecords(true)
      setRecordsError(null)

      const response = await fetch(`/api/patients/${patientId}/records`, {
        cache: 'no-store'
      })

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
  }, [patientId])

  // Verificar se o usuário pode ver prontuários (não é RECEPTIONIST)
  const canViewRecords = session?.user?.role !== UserRole.RECEPTIONIST

  // Verificar se o usuário pode ver financeiro (apenas OWNER e ADMIN)
  const canViewFinance = session?.user?.role === UserRole.OWNER || session?.user?.role === UserRole.ADMIN

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

  // Buscar orçamentos do paciente
  const fetchTreatmentPlans = useCallback(async () => {
    if (!patientId) return

    try {
      setLoadingTreatmentPlans(true)
      setTreatmentPlansError(null)

      const response = await fetch(`/api/treatment-plans?patientId=${patientId}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
      }

      const data: TreatmentPlansApiResponse = await response.json()

      if (data.success && data.data) {
        setTreatmentPlans(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido ao buscar orçamentos')
      }
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar orçamentos'
      setTreatmentPlansError(errorMessage)
    } finally {
      setLoadingTreatmentPlans(false)
    }
  }, [patientId])

  // Carregar orçamentos quando a aba orçamentos for ativada
  useEffect(() => {
    if (activeTab === 'orcamentos' && patient) {
      fetchTreatmentPlans()
    }
  }, [activeTab, patient, fetchTreatmentPlans])

  const handleNewTreatmentPlan = () => {
    setTreatmentPlanModalOpen(true)
  }

  const handleViewTreatmentPlan = (treatmentPlanId: string) => {
    router.push(`/treatment-plans/${treatmentPlanId}`)
  }

  // Buscar pagamentos do paciente
  const fetchPayments = useCallback(async () => {
    if (!patientId) return

    try {
      setLoadingPayments(true)
      setPaymentsError(null)

      const response = await fetch(`/api/payments?patientId=${patientId}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
      }

      const data: PaymentsApiResponse = await response.json()

      if (data.success && data.data) {
        setPayments(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido ao buscar pagamentos')
      }
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pagamentos'
      setPaymentsError(errorMessage)
    } finally {
      setLoadingPayments(false)
    }
  }, [patientId])

  // Carregar pagamentos quando a aba financeiro for ativada
  useEffect(() => {
    if (activeTab === 'financeiro' && patient && canViewFinance) {
      fetchPayments()
    }
  }, [activeTab, patient, canViewFinance, fetchPayments])

  const handleNewPayment = () => {
    setPaymentModalOpen(true)
  }

  // Buscar atendimentos do paciente
  const fetchAttendances = useCallback(async () => {
    if (!patientId) return

    try {
      setLoadingAttendances(true)
      setAttendancesError(null)

      const response = await fetch(`/api/attendances?patientId=${patientId}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        setAttendances(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido ao buscar atendimentos')
      }
    } catch (err) {
      console.error('Erro ao buscar atendimentos:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atendimentos'
      setAttendancesError(errorMessage)
    } finally {
      setLoadingAttendances(false)
    }
  }, [patientId])

  // Carregar atendimentos quando a aba atendimentos for ativada
  useEffect(() => {
    if (activeTab === 'atendimentos' && patient) {
      fetchAttendances()
    }
  }, [activeTab, patient, fetchAttendances])

  const handleViewAttendance = (attendanceId: string) => {
    router.push(`/attendances/${attendanceId}`)
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
    { id: 'atendimentos', label: 'Atendimentos', icon: Clock },
    { id: 'orcamentos', label: 'Orçamentos', icon: Receipt },
    ...(canViewFinance ? [{ id: 'financeiro', label: 'Financeiro', icon: DollarSign }] : []),
    ...(canViewRecords ? [{ id: 'prontuario', label: 'Prontuário', icon: FileText }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para lista</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          <div className="hidden sm:block h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate max-w-[200px] sm:max-w-none">{patient.name}</h1>
            <Badge variant={patient.isActive ? 'success' : 'destructive'}>
              {patient.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
        <Button onClick={handleEdit} className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Cards com informações */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-sm sm:text-base">{patient.name}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm sm:text-base">{formatCpf(patient.cpf)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Data de Nascimento</p>
              <p className="text-sm sm:text-base">{formatDate(patient.birthDate)}</p>
            </div>

            {/* Seção de datas de cadastro */}
            <div className="pt-3 border-t border-border">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Cadastrado em: {format(new Date(patient.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Última atualização: {format(new Date(patient.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Contato</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm sm:text-base truncate">{patient.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="text-sm sm:text-base">{formatPhone(patient.phone)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Endereço</p>
              <p className="text-sm sm:text-base">{patient.address || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {patient.notes && (
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Seção de Abas */}
      <div className="space-y-4">
        {/* Navegação das abas */}
        <div className="border-b overflow-x-auto scrollbar-hide">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max px-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
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
          <CardContent className="p-4 sm:p-6">
            {activeTab === 'agenda' && (
              <div className="space-y-4">
                {/* Header da aba Agenda */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Agendamentos</h3>
                  <Button onClick={handleNewAppointment} size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center">
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
                  <div className="text-center py-8 border rounded-lg">
                    <h4 className="text-md font-semibold text-destructive mb-2">Erro ao carregar agendamentos</h4>
                    <p className="text-muted-foreground mb-4">{appointmentsError}</p>
                    <Button onClick={fetchAppointments} variant="outline" size="sm">
                      Tentar novamente
                    </Button>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
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
                  <>
                    {/* Mobile View for Appointments */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border rounded-lg space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm">
                                {format(new Date(appointment.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                              <p className="text-xs text-muted-foreground">{appointment.durationMinutes} min</p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(appointment.status)}>
                              {getStatusLabel(appointment.status)}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">{appointment.dentist.user.name}</p>
                            <p className="text-xs text-muted-foreground">{appointment.procedure || 'Procedimento não informado'}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tablet/Desktop View for Appointments */}
                    <div className="hidden md:block rounded-md border">
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
                  </>
                )}
              </div>
            )}

            {activeTab === 'atendimentos' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Histórico de Atendimentos</h3>
                </div>

                {loadingAttendances ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando atendimentos...
                    </div>
                  </div>
                ) : attendancesError ? (
                  <div className="text-center py-8 border rounded-lg">
                    <h4 className="text-md font-semibold text-destructive mb-2">Erro ao carregar atendimentos</h4>
                    <p className="text-muted-foreground mb-4">{attendancesError}</p>
                    <Button onClick={fetchAttendances} variant="outline" size="sm">
                      Tentar novamente
                    </Button>
                  </div>
                ) : attendances.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-md font-semibold mb-2">Nenhum atendimento encontrado</h4>
                    <p className="text-muted-foreground">
                      Este paciente ainda não possui atendimentos registrados.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Dentista</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendances.map((att) => (
                          <TableRow key={att.id}>
                            <TableCell className="font-medium">
                              {format(new Date(att.arrivalAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {att.dentist?.user.name || 'Não atribuído'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                att.status === 'DONE' ? 'success' :
                                  att.status === 'IN_PROGRESS' ? 'warning' :
                                    att.status === 'CHECKED_IN' ? 'secondary' : 'destructive'
                              }>
                                {att.status === 'DONE' ? 'Finalizado' :
                                  att.status === 'IN_PROGRESS' ? 'Em Atendimento' :
                                    att.status === 'CHECKED_IN' ? 'Check-in' : 'Cancelado'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() => handleViewAttendance(att.id)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Ver
                              </Button>
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
              <div className="space-y-4">
                {/* Header da aba Orçamentos */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Orçamentos</h3>
                  <Button onClick={handleNewTreatmentPlan} size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Plus className="h-4 w-4" />
                    Novo Orçamento
                  </Button>
                </div>

                {/* Lista de orçamentos */}
                {loadingTreatmentPlans ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando orçamentos...
                    </div>
                  </div>
                ) : treatmentPlansError ? (
                  <div className="text-center py-8 border rounded-lg">
                    <h4 className="text-md font-semibold text-destructive mb-2">Erro ao carregar orçamentos</h4>
                    <p className="text-muted-foreground mb-4">{treatmentPlansError}</p>
                    <Button onClick={fetchTreatmentPlans} variant="outline" size="sm">
                      Tentar novamente
                    </Button>
                  </div>
                ) : treatmentPlans.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-md font-semibold mb-2">Nenhum orçamento encontrado</h4>
                    <p className="text-muted-foreground">
                      Este paciente ainda não possui orçamentos. Use o botão "Novo Orçamento" acima para criar o primeiro.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile View for Treatment Plans */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {treatmentPlans.map((plan) => (
                        <div key={plan.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border rounded-lg space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm">
                                {format(new Date(plan.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-lg font-bold text-primary">
                                {plan.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </p>
                            </div>
                            <Badge variant={
                              plan.status === 'OPEN' ? 'default' :
                                plan.status === 'APPROVED' ? 'success' : 'destructive'
                            }>
                              {plan.status === 'OPEN' ? 'Aberto' :
                                plan.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">Dr(a). {plan.dentist?.user.name || 'N/A'}</p>
                          </div>
                          <Button
                            onClick={() => handleViewTreatmentPlan(plan.id)}
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center gap-2 justify-center h-10"
                          >
                            <Eye className="h-4 w-4" />
                            Ver Detalhes
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Tablet/Desktop View for Treatment Plans */}
                    <div className="hidden md:block rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Dentista</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {treatmentPlans.map((plan) => (
                            <TableRow key={plan.id}>
                              <TableCell className="font-medium">
                                {format(new Date(plan.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{plan.dentist?.user.name || 'N/A'}</span>
                                  {plan.dentist?.cro && (
                                    <span className="text-sm text-muted-foreground">
                                      CRO: {plan.dentist.cro}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span>
                                    {(plan.finalAmount ?? plan.totalAmount).toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    })}
                                  </span>
                                  {plan.discountValue && (
                                    <span className="text-[10px] text-destructive">
                                      Desconto: {plan.discountType === 'PERCENTAGE' ? `${plan.discountValue}%` :
                                        plan.discountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  plan.status === 'OPEN' ? 'default' :
                                    plan.status === 'APPROVED' ? 'success' : 'destructive'
                                }>
                                  {plan.status === 'OPEN' ? 'Aberto' :
                                    plan.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() => handleViewTreatmentPlan(plan.id)}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Ver
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'financeiro' && canViewFinance && (
              <div className="space-y-4">
                {/* Header da aba Financeiro */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Histórico Financeiro</h3>
                  <Button onClick={handleNewPayment} size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Plus className="h-4 w-4" />
                    Novo Pagamento
                  </Button>
                </div>

                {/* Resumo do paciente */}
                <Card className="bg-primary/5">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Pago pelo Paciente</p>
                        <p className="text-xl sm:text-2xl font-bold text-primary">
                          {loadingPayments ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            payments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })
                          )}
                        </p>
                      </div>
                      <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary/60" />
                    </div>
                    {!loadingPayments && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {payments.length} pagamento{payments.length !== 1 ? 's' : ''} registrado{payments.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Lista de pagamentos */}
                {loadingPayments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando pagamentos...
                    </div>
                  </div>
                ) : paymentsError ? (
                  <div className="text-center py-8 border rounded-lg">
                    <h4 className="text-md font-semibold text-destructive mb-2">Erro ao carregar pagamentos</h4>
                    <p className="text-muted-foreground mb-4">{paymentsError}</p>
                    <Button onClick={fetchPayments} variant="outline" size="sm">
                      Tentar novamente
                    </Button>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-md font-semibold mb-2">Nenhum pagamento registrado</h4>
                    <p className="text-muted-foreground">
                      Este paciente ainda não possui pagamentos registrados. Use o botão "Novo Pagamento" acima para registrar o primeiro.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile View for Payments */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {payments.map((payment) => (
                        <div key={payment.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm">
                                {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                              <p className="text-base font-bold text-primary">
                                {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </p>
                            </div>
                            <Badge variant={
                              payment.method === 'CASH' ? 'success' :
                                payment.method === 'PIX' ? 'default' : 'secondary'
                            }>
                              {payment.method === 'CASH' ? 'Dinheiro' :
                                payment.method === 'PIX' ? 'PIX' : 'Cartão'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{payment.description || '-'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tablet/Desktop View for Payments */}
                    <div className="hidden md:block rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Descrição</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">
                                {format(new Date(payment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span>
                                    {payment.amount.toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    })}
                                  </span>
                                  {payment.discountValue && (
                                    <span className="text-[10px] text-destructive">
                                      Orig: {payment.originalAmount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  payment.method === 'CASH' ? 'success' :
                                    payment.method === 'PIX' ? 'default' : 'secondary'
                                }>
                                  {payment.method === 'CASH' ? 'Dinheiro' :
                                    payment.method === 'PIX' ? 'PIX' : 'Cartão'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {payment.description || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'prontuario' && canViewRecords && (
              <div className="space-y-4">
                {/* Header da aba Prontuário */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Prontuário Médico</h3>
                  <Button onClick={handleNewRecord} size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center">
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
                  <div className="text-center py-8 border rounded-lg">
                    <h4 className="text-md font-semibold text-destructive mb-2">Erro ao carregar prontuários</h4>
                    <p className="text-muted-foreground mb-4">{recordsError}</p>
                    <Button onClick={fetchRecords} variant="outline" size="sm">
                      Tentar novamente
                    </Button>
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-md font-semibold mb-2">Nenhum registro encontrado</h4>
                    <p className="text-muted-foreground">
                      Este paciente ainda não possui registros no prontuário. Use o botão "Novo Registro" acima para criar o primeiro.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {records.map((record) => (
                      <Card key={record.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                <span className="font-medium">
                                  {format(new Date(record.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span>Dr(a). {record.dentist.user.name}</span>
                                {record.dentist.specialty && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{record.dentist.specialty}</span>
                                  </>
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-medium">Descrição:</p>
                                <p className="text-sm text-muted-foreground">
                                  {truncateDescription(record.description)}
                                </p>
                              </div>
                              {record.appointment && (
                                <div className="text-[10px] sm:text-xs text-muted-foreground italic">
                                  Relacionado ao agendamento de {format(new Date(record.appointment.date), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleViewRecord(record.id)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 w-full sm:w-auto justify-center h-9 sm:h-8"
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

      {/* Modal de novo agendamento */}
      {patientId && (
        <AppointmentFormModal
          open={appointmentModalOpen}
          onOpenChange={setAppointmentModalOpen}
          onSuccess={() => {
            setAppointmentModalOpen(false)
            fetchAppointments()
          }}
          patientId={patientId}
        />
      )}

      {/* Modal de edição */}
      <PatientFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        patient={patient ? {
          ...patient,
          birthDate: patient.birthDate ? new Date(patient.birthDate) : null,
          createdAt: new Date(patient.createdAt),
          updatedAt: new Date(patient.updatedAt),
        } as PatientOutput : undefined}
        onSuccess={handleEditSuccess}
      />

      {/* Modal de novo prontuário */}
      {patientId && (
        <RecordFormModal
          open={recordModalOpen}
          onOpenChange={setRecordModalOpen}
          patientId={patientId}
          onSuccess={() => {
            setRecordModalOpen(false)
            fetchRecords()
          }}
        />
      )}

      {/* Modal de novo orçamento */}
      {patientId && (
        <TreatmentPlanFormModal
          open={treatmentPlanModalOpen}
          onOpenChange={setTreatmentPlanModalOpen}
          onSuccess={() => {
            setTreatmentPlanModalOpen(false)
            fetchTreatmentPlans()
          }}
          patientId={patientId}
        />
      )}

      {/* Modal de novo pagamento */}
      {patientId && (
        <PaymentFormModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          onSuccess={() => {
            setPaymentModalOpen(false)
            fetchPayments()
          }}
          patientId={patientId}
        />
      )}
    </div>
  )
}