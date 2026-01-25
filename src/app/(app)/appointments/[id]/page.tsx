"use client"

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  User, 
  Stethoscope, 
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppointmentStatus } from '@prisma/client'

interface AppointmentDetailsPageProps {
  params: Promise<{ id: string }>
}

interface AppointmentData {
  id: string
  clinicId: string
  dentistId: string
  patientId: string
  date: string
  durationMinutes: number
  status: AppointmentStatus
  procedure: string | null
  procedureId: string | null
  procedureSnapshot: {
    name: string
    baseValue: number
    commissionPercentage: number
  } | null
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

const statusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
  RESCHEDULED: 'Reagendado',
  NO_SHOW: 'Não Compareceu',
  DONE: 'Concluído'
}

const statusVariants: Record<AppointmentStatus, 'default' | 'secondary' | 'success' | 'outline' | 'destructive' | 'warning'> = {
  SCHEDULED: 'default',
  CONFIRMED: 'success',
  CANCELED: 'destructive',
  RESCHEDULED: 'secondary',
  NO_SHOW: 'warning',
  DONE: 'success'
}

export default function AppointmentDetailsPage({ params }: AppointmentDetailsPageProps) {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { id } = use(params)
  
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchAppointment()
  }, [id, session, sessionStatus, router])

  const fetchAppointment = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/appointments/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Agendamento não encontrado')
        } else if (response.status === 403) {
          setError('Acesso negado')
        } else {
          throw new Error(`Erro HTTP: ${response.status}`)
        }
        return
      }

      const data = await response.json()

      if (data.success && data.data) {
        setAppointment(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar agendamento:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar agendamento')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/appointments')
  }

  const handlePatientClick = () => {
    if (appointment) {
      router.push(`/patients/${appointment.patientId}`)
    }
  }

  const handleDentistClick = () => {
    if (appointment) {
      router.push(`/dentists/${appointment.dentistId}`)
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando agendamento...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Erro</h2>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar agendamento</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleBack} variant="outline">
                Voltar para Agendamentos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  const appointmentDate = new Date(appointment.date)
  const procedureName = appointment.procedureSnapshot?.name || appointment.procedure || 'Não informado'

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack} size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Detalhes do Agendamento</h2>
          <p className="text-muted-foreground">
            Informações completas do agendamento
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Informações Principais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Data e Hora</span>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Duração: {appointment.durationMinutes} minutos
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariants[appointment.status]}>
                  {statusLabels[appointment.status]}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Procedimento</span>
              </div>
              <p className="text-sm text-muted-foreground">{procedureName}</p>
            </div>
          </CardContent>
        </Card>

        {/* Paciente */}
        <Card>
          <CardHeader>
            <CardTitle>Paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Nome</span>
              </div>
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-left"
                onClick={handlePatientClick}
              >
                {appointment.patient.name}
              </Button>
            </div>

            {appointment.patient.phone && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                <p className="text-sm">{appointment.patient.phone}</p>
              </div>
            )}

            {appointment.patient.email && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm">{appointment.patient.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dentista */}
        <Card>
          <CardHeader>
            <CardTitle>Dentista</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Nome</span>
              </div>
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-left"
                onClick={handleDentistClick}
              >
                {appointment.dentist.user.name}
              </Button>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">CRO</p>
              <p className="text-sm">{appointment.dentist.cro}</p>
            </div>

            {appointment.dentist.specialty && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Especialidade</p>
                <p className="text-sm">{appointment.dentist.specialty}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        {appointment.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Criado em</span>
            <span>{format(new Date(appointment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Última atualização</span>
            <span>{format(new Date(appointment.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
