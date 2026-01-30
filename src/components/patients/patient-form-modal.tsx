"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PatientOutput } from '@/modules/patients/domain/patient.schema'
import { 
  formatPhone, 
  formatCPF, 
  validateCPF, 
  validateEmail,
  unmaskPhone,
  unmaskCPF
} from '@/lib/masks'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Schema para criar paciente
const createPatientFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string()
    .refine((val) => !val || val === '' || validateEmail(val), 'Email deve ter um formato válido')
    .optional(),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
  cpf: z.string()
    .refine((val) => !val || val === '' || validateCPF(val), 'CPF inválido')
    .optional(),
  birthDate: z.string().optional(),
  address: z.string().max(500, 'Endereço deve ter no máximo 500 caracteres').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

// Schema para editar paciente
const updatePatientFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string()
    .refine((val) => !val || val === '' || validateEmail(val), 'Email deve ter um formato válido')
    .optional(),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
  cpf: z.string()
    .refine((val) => !val || val === '' || validateCPF(val), 'CPF inválido')
    .optional(),
  birthDate: z.string().optional(),
  address: z.string().max(500, 'Endereço deve ter no máximo 500 caracteres').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
  isActive: z.boolean().optional(),
})

type CreatePatientFormData = z.infer<typeof createPatientFormSchema>
type UpdatePatientFormData = z.infer<typeof updatePatientFormSchema>

interface PatientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: PatientOutput
  onSuccess: () => void
}

export function PatientFormModal({ open, onOpenChange, patient, onSuccess }: PatientFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    cpf?: string
  }>({})
  
  const isEditing = !!patient
  const title = isEditing ? 'Editar Paciente' : 'Novo Paciente'

  // Configurar formulário baseado no modo (criar/editar)
  const schema = isEditing ? updatePatientFormSchema : createPatientFormSchema
  
  const form = useForm<CreatePatientFormData | UpdatePatientFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      birthDate: '',
      address: '',
      notes: '',
      ...(isEditing && { isActive: true }),
    },
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, trigger } = form

  // Formatar data para input date (aceita string ou Date do Prisma)
  const formatDateForInput = (date: string | Date | null) => {
    if (!date) return ''
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      return d.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  // Preencher formulário quando editando
  useEffect(() => {
    if (open) {
      if (isEditing && patient) {
        setValue('name', patient.name)
        setValue('email', patient.email || '')
        // Aplicar máscara no telefone e CPF ao carregar
        setValue('phone', patient.phone ? formatPhone(patient.phone) : '')
        setValue('cpf', patient.cpf ? formatCPF(patient.cpf) : '')
        setValue('birthDate', formatDateForInput(patient.birthDate))
        setValue('address', patient.address || '')
        setValue('notes', patient.notes || '')
        setValue('isActive', patient.isActive)
      } else {
        reset({
          name: '',
          email: '',
          phone: '',
          cpf: '',
          birthDate: '',
          address: '',
          notes: '',
          isActive: true,
        })
      }
    }
  }, [isEditing, patient, setValue, reset, open])

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      setFieldErrors({})
      reset()
    }
  }, [open, reset])

  // Handlers para máscaras e validações
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setValue('cpf', formatted)
  }

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value
    if (email && !validateEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Email deve ter um formato válido' }))
    } else {
      setFieldErrors(prev => ({ ...prev, email: undefined }))
    }
    trigger('email')
  }

  const handleCPFBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const cpf = e.target.value
    if (cpf && !validateCPF(cpf)) {
      setFieldErrors(prev => ({ ...prev, cpf: 'CPF inválido' }))
    } else {
      setFieldErrors(prev => ({ ...prev, cpf: undefined }))
    }
    trigger('cpf')
  }

  const onSubmit = async (data: CreatePatientFormData | UpdatePatientFormData) => {
    try {
      setLoading(true)
      setError(null)

      const url = isEditing ? `/api/patients/${patient!.id}` : '/api/patients'
      const method = isEditing ? 'PATCH' : 'POST'

      // Preparar dados para envio
      const submitData: any = {
        name: data.name,
      }

      // Adicionar campos opcionais apenas se preenchidos
      if (data.email && data.email.trim() !== '') {
        submitData.email = data.email
      }

      if (data.phone && data.phone.trim() !== '') {
        // Remove máscara antes de enviar
        submitData.phone = unmaskPhone(data.phone)
      }

      if (data.cpf && data.cpf.trim() !== '') {
        // Remove máscara antes de enviar
        submitData.cpf = unmaskCPF(data.cpf)
      }

      if (data.birthDate && data.birthDate.trim() !== '') {
        // Converter data para ISO string
        const date = new Date(data.birthDate)
        submitData.birthDate = date.toISOString()
      }

      if (data.address && data.address.trim() !== '') {
        submitData.address = data.address
      }

      if (data.notes && data.notes.trim() !== '') {
        submitData.notes = data.notes
      }

      // Adicionar isActive apenas ao editar
      if (isEditing && 'isActive' in data) {
        submitData.isActive = data.isActive
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
        throw new Error(result.error || 'Erro ao salvar paciente')
      }

      // Sucesso
      onSuccess()
      onOpenChange(false)
      reset()

    } catch (err) {
      console.error('Erro ao salvar paciente:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar paciente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
          {/* Nome */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Nome *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Digite o nome completo"
              disabled={loading}
              className="h-11 sm:h-10 text-sm sm:text-base"
            />
            {errors.name && (
              <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="email@exemplo.com"
              disabled={loading}
              onBlur={handleEmailBlur}
              className={cn(
                "h-11 sm:h-10 text-sm sm:text-base",
                (errors.email || fieldErrors.email) && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {(errors.email || fieldErrors.email) && (
              <p className="text-xs sm:text-sm text-destructive">
                {errors.email?.message || fieldErrors.email}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs sm:text-sm">Telefone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(11) 99999-9999"
              disabled={loading}
              onChange={handlePhoneChange}
              className="h-11 sm:h-10 text-sm sm:text-base"
            />
            {errors.phone && (
              <p className="text-xs sm:text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-xs sm:text-sm">CPF</Label>
            <Input
              id="cpf"
              {...register('cpf')}
              placeholder="000.000.000-00"
              disabled={loading}
              onChange={handleCPFChange}
              onBlur={handleCPFBlur}
              className={cn(
                "h-11 sm:h-10 text-sm sm:text-base",
                (errors.cpf || fieldErrors.cpf) && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {(errors.cpf || fieldErrors.cpf) && (
              <p className="text-xs sm:text-sm text-destructive">
                {errors.cpf?.message || fieldErrors.cpf}
              </p>
            )}
          </div>

          {/* Data de Nascimento */}
          <div className="space-y-2">
            <Label htmlFor="birthDate" className="text-xs sm:text-sm">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              {...register('birthDate')}
              disabled={loading}
              className="h-11 sm:h-10 text-sm sm:text-base"
            />
            {errors.birthDate && (
              <p className="text-xs sm:text-sm text-destructive">{errors.birthDate.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address" className="text-xs sm:text-sm">Endereço</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Rua, número, bairro, cidade"
              disabled={loading}
              className="h-11 sm:h-10 text-sm sm:text-base"
            />
            {errors.address && (
              <p className="text-xs sm:text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">Observações</Label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre o paciente..."
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.notes && (
              <p className="text-xs sm:text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {/* Status (apenas ao editar) */}
          {isEditing && (
            <div className="flex items-center space-x-2 sm:col-span-2">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="text-xs sm:text-sm font-normal">
                Paciente ativo
              </Label>
            </div>
          )}

          {/* Datas de cadastro (apenas ao editar) */}
          {isEditing && patient && (
            <div className="sm:col-span-2 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Cadastrado em: {format(new Date(patient.createdAt), "dd/MM/yyyy", { locale: ptBR })} | 
                Atualizado em: {format(new Date(patient.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          )}

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
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto order-1 sm:order-2">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Paciente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}