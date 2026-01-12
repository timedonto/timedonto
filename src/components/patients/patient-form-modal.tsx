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

// Schema para criar paciente
const createPatientFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email deve ter um formato válido').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
  cpf: z.string().max(14, 'CPF deve ter no máximo 14 caracteres').optional(),
  birthDate: z.string().optional(),
  address: z.string().max(500, 'Endereço deve ter no máximo 500 caracteres').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

// Schema para editar paciente
const updatePatientFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email deve ter um formato válido').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
  cpf: z.string().max(14, 'CPF deve ter no máximo 14 caracteres').optional(),
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

  const { register, handleSubmit, formState: { errors }, reset, setValue } = form

  // Formatar data para input date
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  // Preencher formulário quando editando
  useEffect(() => {
    if (isEditing && patient) {
      setValue('name', patient.name)
      setValue('email', patient.email || '')
      setValue('phone', patient.phone || '')
      setValue('cpf', patient.cpf || '')
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
  }, [isEditing, patient, setValue, reset])

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      reset()
    }
  }, [open, reset])

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
        submitData.phone = data.phone
      }

      if (data.cpf && data.cpf.trim() !== '') {
        submitData.cpf = data.cpf
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Digite o nome completo"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="email@exemplo.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              {...register('cpf')}
              placeholder="000.000.000-00"
              disabled={loading}
            />
            {errors.cpf && (
              <p className="text-sm text-destructive">{errors.cpf.message}</p>
            )}
          </div>

          {/* Data de Nascimento */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              {...register('birthDate')}
              disabled={loading}
            />
            {errors.birthDate && (
              <p className="text-sm text-destructive">{errors.birthDate.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Rua, número, bairro, cidade"
              disabled={loading}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre o paciente..."
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {/* Status (apenas ao editar) */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="text-sm font-normal">
                Paciente ativo
              </Label>
            </div>
          )}

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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Paciente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}