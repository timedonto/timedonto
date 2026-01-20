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

// P0.4 - Schema para criar agendamento (usando procedureId)
const createAppointmentFormSchema = z.object({
  dentistId: z.string().min(1, 'Selecione um dentista'),
  patientId: z.string().min(1, 'Selecione um paciente'),
  date: z.string().min(1, 'Data e hora são obrigatórias'),
  durationMinutes: z.number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração deve ser no mínimo 15 minutos')
    .max(480, 'Duração deve ser no máximo 8 horas'),
  procedureId: z.string().min(1, 'Selecione um procedimento'),
  notes: z.string().optional(),
})

// P0.4 - Schema para editar agendamento (usando procedureId)
const updateAppointmentFormSchema = z.object({
  dentistId: z.string().min(1, 'Selecione um dentista'),
  patientId: z.string().min(1, 'Selecione um paciente'),
  date: z.string().min(1, 'Data e hora são obrigatórias'),
  durationMinutes: z.number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração deve ser no mínimo 15 minutos')
    .max(480, 'Duração deve ser no máximo 8 horas'),
  status: z.nativeEnum(AppointmentStatus),
  procedureId: z.string().optional(),
  notes: z.string().optional(),
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

// P0.5 - Interface para Procedure
interface Procedure {
  id: string
  name: string
  description: string | null
  baseValue: number
  isActive: boolean
  specialty: {
    id: string
    name: string
  }
}

interface AppointmentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: AppointmentOutput
  onSuccess: () => void
  patientId?: string
}

export function AppointmentFormModal({ open, onOpenChange, appointment, onSuccess, patientId }: AppointmentFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loadingDentists, setLoadingDentists] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingProcedures, setLoadingProcedures] = useState(false)

  const isEditing = !!appointment
  const title = isEditing ? 'Editar Agendamento' : 'Novo Agendamento'

  // Configurar formulário baseado no modo (criar/editar)
  const schema = isEditing ? updateAppointmentFormSchema : createAppointmentFormSchema

  const form = useForm<CreateAppointmentFormData | UpdateAppointmentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dentistId: '',
      patientId: patientId || '',
      date: '',
      durationMinutes: 30,
      ...(isEditing && { status: AppointmentStatus.SCHEDULED }),
      procedureId: '',
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

  // P0.5 - Buscar procedimentos por dentista
  const fetchProceduresByDentist = async (dentistId: string) => {
    if (!dentistId) {
      setProcedures([])
      return
    }

    try {
      setLoadingProcedures(true)
      const response = await fetch(`/api/dentists/${dentistId}/procedures`)
      const data = await response.json()

      if (response.ok && data.success) {
        setProcedures(data.data || [])
      } else {
        console.error('Erro ao buscar procedimentos do dentista:', data.error)
        setProcedures([])
      }
    } catch (err) {
      console.error('Erro ao buscar procedimentos do dentista:', err)
      setProcedures([])
    } finally {
      setLoadingProcedures(false)
    }
  }

  // Preencher formulário quando editando ou quando patientId mudar
  useEffect(() => {
    if (isEditing && appointment) {
      setValue('dentistId', appointment.dentistId)
      setValue('patientId', appointment.patientId)
      setValue('date', formatDateTimeForInput(appointment.date))
      setValue('durationMinutes', appointment.durationMinutes)
      setValue('status', appointment.status)
      setValue('procedureId', (appointment as any).procedureId || '')
      setValue('notes', appointment.notes || '')
    } else {
      reset({
        dentistId: '',
        patientId: patientId || '',
        date: '',
        durationMinutes: 30,
        procedureId: '',
        notes: '',
      })
    }
  }, [isEditing, appointment, patientId, setValue, reset])

  // Buscar dados quando modal abrir
  useEffect(() => {
    if (open) {
      fetchDentists()
      fetchPatients()
      // Não buscar procedimentos aqui - será feito ao selecionar dentista
    }
  }, [open])

  // Observar mudança de dentista e carregar procedimentos
  useEffect(() => {
    const selectedDentistId = watch('dentistId')

    if (selectedDentistId) {
      // Limpar procedureId ao trocar dentista
      setValue('procedureId', '')
      // Carregar procedimentos do dentista
      fetchProceduresByDentist(selectedDentistId)
    } else {
      // Limpar procedimentos se nenhum dentista selecionado
      setProcedures([])
      setValue('procedureId', '')
    }
  }, [watch('dentistId')])

  // Garantir que o patientId seja definido quando os pacientes forem carregados
  useEffect(() => {
    if (patientId && patients.length > 0 && !isEditing) {
      setValue('patientId', patientId)
    }
  }, [patientId, patients, isEditing, setValue])

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
        procedureId: data.procedureId || null,
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
        setError(result.error || 'Erro ao salvar agendamento')
        return
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
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Dentista */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dentistId" className="text-xs sm:text-sm">Dentista *</Label>
            {loadingDentists ? (
              <div className="flex items-center gap-2 p-2 text-xs sm:text-sm text-muted-foreground border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dentistas...
              </div>
            ) : (
              <Select
                value={selectedDentistId || ''}
                onValueChange={(value) => setValue('dentistId', value)}
                disabled={loading}
              >
                <SelectTrigger className="h-11 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Selecione um dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.length === 0 ? (
                    <div className="p-2 text-xs sm:text-sm text-muted-foreground text-center">
                      Nenhum dentista disponível
                    </div>
                  ) : (
                    dentists.map((dentist) => (
                      <SelectItem key={dentist.id} value={dentist.id}>
                        <div className="text-xs sm:text-sm text-left">
                          <div className="font-medium">{dentist.user.name}</div>
                          <div className="text-muted-foreground text-[10px] sm:text-xs">
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
              <p className="text-xs sm:text-sm text-destructive">{errors.dentistId.message}</p>
            )}
          </div>

          {/* Paciente */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="patientId" className="text-xs sm:text-sm">Paciente *</Label>
            {loadingPatients ? (
              <div className="flex items-center gap-2 p-2 text-xs sm:text-sm text-muted-foreground border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando pacientes...
              </div>
            ) : (
              <Select
                value={selectedPatientId || ''}
                onValueChange={(value) => setValue('patientId', value)}
                disabled={loading || !!patientId}
              >
                <SelectTrigger className="h-11 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.length === 0 ? (
                    <div className="p-2 text-xs sm:text-sm text-muted-foreground text-center">
                      Nenhum paciente disponível
                    </div>
                  ) : (
                    patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div className="text-xs sm:text-sm text-left">
                          <div className="font-medium">{patient.name}</div>
                          {patient.phone && (
                            <div className="text-muted-foreground text-[10px] sm:text-xs">{patient.phone}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.patientId && (
              <p className="text-xs sm:text-sm text-destructive">{errors.patientId.message}</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs sm:text-sm">Data e Hora *</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register('date')}
              disabled={loading}
              className="h-11 sm:h-10 text-sm sm:text-base"
            />
            {errors.date && (
              <p className="text-xs sm:text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="durationMinutes" className="text-xs sm:text-sm">Duração (min) *</Label>
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
              className="h-11 sm:h-10 text-sm sm:text-base"
            />
            {errors.durationMinutes && (
              <p className="text-xs sm:text-sm text-destructive">{errors.durationMinutes.message}</p>
            )}
          </div>

          {/* Status (apenas ao editar) */}
          {isEditing && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="status" className="text-xs sm:text-sm">Status *</Label>
              <Select
                value={selectedStatus || ''}
                onValueChange={(value) => setValue('status', value as AppointmentStatus)}
                disabled={loading}
              >
                <SelectTrigger className="h-11 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AppointmentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      <span className="text-xs sm:text-sm">{getStatusLabel(status)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs sm:text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>
          )}

          {/* P0.4 & P0.5 - Procedimento */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="procedureId" className="text-xs sm:text-sm">Procedimento *</Label>
            {loadingProcedures ? (
              <div className="flex items-center gap-2 p-2 text-xs sm:text-sm text-muted-foreground border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando procedimentos...
              </div>
            ) : (
              <Select
                value={watch('procedureId') || ''}
                onValueChange={(value) => setValue('procedureId', value)}
                disabled={loading || !watch('dentistId')}
              >
                <SelectTrigger className="h-11 sm:h-10 text-sm sm:text-base">
                  <SelectValue
                    placeholder={
                      !watch('dentistId')
                        ? "Selecione um dentista primeiro"
                        : "Selecione um procedimento"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {procedures.length === 0 ? (
                    <div className="p-2 text-xs sm:text-sm text-muted-foreground text-center">
                      {!watch('dentistId')
                        ? "Selecione um dentista primeiro"
                        : "Este dentista não possui procedimentos vinculados"
                      }
                    </div>
                  ) : (
                    procedures.map((procedure) => (
                      <SelectItem key={procedure.id} value={procedure.id}>
                        <div className="text-xs sm:text-sm text-left">
                          <div className="font-medium">{procedure.name}</div>
                          <div className="text-muted-foreground text-[10px] sm:text-xs">
                            {procedure.specialty.name} - R$ {procedure.baseValue.toFixed(2)}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.procedureId && (
              <p className="text-xs sm:text-sm text-destructive">{errors.procedureId.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">Observações</Label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais..."
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            {errors.notes && (
              <p className="text-xs sm:text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 sm:col-span-2">
              <p className="text-xs sm:text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1 h-11 sm:h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingDentists || loadingPatients}
              className="w-full sm:w-auto order-1 sm:order-2 h-11 sm:h-10"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
