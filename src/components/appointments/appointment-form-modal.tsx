"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { AppointmentStatus } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppointmentOutput } from '@/modules/appointments/domain/appointment.schema'

// Schema para criar agendamento
const createAppointmentFormSchema = z.object({
  dentistId: z.string().min(1, 'Selecione um dentista'),
  patientId: z.string().min(1, 'Selecione um paciente'),
  date: z.string().min(1, 'Data e hora são obrigatórias'),
  durationMinutes: z.number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração deve ser no mínimo 15 minutos')
    .max(480, 'Duração deve ser no máximo 8 horas'),
  procedure: z.string().default(''),
  notes: z.string().default(''),
})

// Schema para editar agendamento
const updateAppointmentFormSchema = z.object({
  dentistId: z.string().min(1, 'Selecione um dentista'),
  patientId: z.string().min(1, 'Selecione um paciente'),
  date: z.string().min(1, 'Data e hora são obrigatórias'),
  durationMinutes: z.number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração deve ser no mínimo 15 minutos')
    .max(480, 'Duração deve ser no máximo 8 horas'),
  status: z.nativeEnum(AppointmentStatus),
  procedure: z.string().default(''),
  notes: z.string().default(''),
})

type CreateAppointmentFormData = z.infer<typeof createAppointmentFormSchema>
type UpdateAppointmentFormData = z.infer<typeof updateAppointmentFormSchema>

interface Dentist {
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

interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
  isActive: boolean
}

interface AppointmentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: AppointmentOutput
  onSuccess: () => void
}

export function AppointmentFormModal({ open, onOpenChange, appointment, onSuccess }: AppointmentFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingDentists, setLoadingDentists] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  
  const isEditing = !!appointment
  const title = isEditing ? 'Editar Agendamento' : 'Novo Agendamento'

  // Configurar formulário baseado no modo (criar/editar)
  const schema = isEditing ? updateAppointmentFormSchema : createAppointmentFormSchema
  
  const form = useForm<CreateAppointmentFormData | UpdateAppointmentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dentistId: '',
      patientId: '',
      date: '',
      durationMinutes: 30,
      ...(isEditing && { status: AppointmentStatus.SCHEDULED }),
      procedure: '',
      notes: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form

  // Formatar data para input datetime-local
  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Buscar dentistas
  const fetchDentists = async () => {
    try {
      setLoadingDentists(true)
      const response = await fetch('/api/dentists')
      const data = await response.json()

      if (response.ok && data.success) {
        setDentists(data.data.filter((dentist: Dentist) => dentist.user.isActive))
      } else {
        console.error('Erro ao buscar dentistas:', data.error)
      }
    } catch (err) {
      console.error('Erro ao buscar dentistas:', err)
    } finally {
      setLoadingDentists(false)
    }
  }

  // Buscar pacientes
  const fetchPatients = async () => {
    try {
      setLoadingPatients(true)
      const response = await fetch('/api/patients')
      const data = await response.json()

      if (response.ok && data.success) {
        setPatients(data.data.filter((patient: Patient) => patient.isActive))
      } else {
        console.error('Erro ao buscar pacientes:', data.error)
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err)
    } finally {
      setLoadingPatients(false)
    }
  }

  // Preencher formulário quando editando
  useEffect(() => {
    if (isEditing && appointment) {
      setValue('dentistId', appointment.dentistId)
      setValue('patientId', appointment.patientId)
      setValue('date', formatDateTimeForInput(appointment.date))
      setValue('durationMinutes', appointment.durationMinutes)
      setValue('status', appointment.status)
      setValue('procedure', appointment.procedure || '')
      setValue('notes', appointment.notes || '')
    } else {
      reset({
        dentistId: '',
        patientId: '',
        date: '',
        durationMinutes: 30,
        ...(isEditing && { status: AppointmentStatus.SCHEDULED }),
        procedure: '',
        notes: '',
      })
    }
  }, [isEditing, appointment, setValue, reset])

  // Buscar dados quando modal abrir
  useEffect(() => {
    if (open) {
      fetchDentists()
      fetchPatients()
    }
  }, [open])

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      reset()
    }
  }, [open, reset])

  const onSubmit = async (data: CreateAppointmentFormData | UpdateAppointmentFormData) => {
    try {
      setLoading(true)
      setError(null)

      const url = isEditing ? `/api/appointments/${appointment!.id}` : '/api/appointments'
      const method = isEditing ? 'PATCH' : 'POST'

      // Preparar dados para envio
      const submitData: any = {
        dentistId: data.dentistId,
        patientId: data.patientId,
        date: new Date(data.date).toISOString(),
        durationMinutes: data.durationMinutes,
        procedure: data.procedure?.trim() || null,
        notes: data.notes?.trim() || null,
      }

      // Adicionar status apenas ao editar
      if (isEditing && 'status' in data) {
        submitData.status = data.status
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao salvar agendamento')
      }

      // Sucesso
      onSuccess()
      onOpenChange(false)
      reset()

    } catch (err) {
      console.error('Erro ao salvar agendamento:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar agendamento')
    } finally {
      setLoading(false)
    }
  }

  const selectedDentistId = watch('dentistId')
  const selectedPatientId = watch('patientId')
  const selectedStatus = isEditing ? watch('status') : undefined

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Dentista */}
          <div className="space-y-2">
            <Label htmlFor="dentistId">Dentista *</Label>
            {loadingDentists ? (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dentistas...
              </div>
            ) : (
              <Select
                value={selectedDentistId || ''}
                onValueChange={(value) => setValue('dentistId', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum dentista disponível
                    </div>
                  ) : (
                    dentists.map((dentist) => (
                      <SelectItem key={dentist.id} value={dentist.id}>
                        <div>
                          <div className="font-medium">{dentist.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {dentist.cro} {dentist.specialty && `- ${dentist.specialty}`}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.dentistId && (
              <p className="text-sm text-destructive">{errors.dentistId.message}</p>
            )}
          </div>

          {/* Paciente */}
          <div className="space-y-2">
            <Label htmlFor="patientId">Paciente *</Label>
            {loadingPatients ? (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando pacientes...
              </div>
            ) : (
              <Select
                value={selectedPatientId || ''}
                onValueChange={(value) => setValue('patientId', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum paciente disponível
                    </div>
                  ) : (
                    patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          {patient.phone && (
                            <div className="text-sm text-muted-foreground">{patient.phone}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.patientId && (
              <p className="text-sm text-destructive">{errors.patientId.message}</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="space-y-2">
            <Label htmlFor="date">Data e Hora *</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register('date')}
              disabled={loading}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duração (minutos) *</Label>
            <Input
              id="durationMinutes"
              type="number"
              min="15"
              max="480"
              step="1"
              {...register('durationMinutes', { 
                setValueAs: (value) => parseInt(value) || 30 
              })}
              placeholder="30"
              disabled={loading}
            />
            {errors.durationMinutes && (
              <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>
            )}
          </div>

          {/* Status (apenas ao editar) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={selectedStatus || ''}
                onValueChange={(value) => setValue('status', value as AppointmentStatus)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AppointmentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>
          )}

          {/* Procedimento */}
          <div className="space-y-2">
            <Label htmlFor="procedure">Procedimento</Label>
            <Input
              id="procedure"
              {...register('procedure')}
              placeholder="Ex: Limpeza, Consulta, Restauração"
              disabled={loading}
            />
            {errors.procedure && (
              <p className="text-sm text-destructive">{errors.procedure.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre o agendamento..."
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingDentists || loadingPatients}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}