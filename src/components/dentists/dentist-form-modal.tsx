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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DentistOutput } from '@/modules/dentists/domain/dentist.schema'
import { SpecialtyOutput } from '@/modules/specialties/domain/specialty.schema'

// Schema para criar dentista
const createDentistFormSchema = z.object({
  userId: z.string().min(1, 'Selecione um usuário'),
  cro: z.string()
    .min(1, 'CRO é obrigatório')
    .regex(/^CRO-[A-Z]{2}\s+\d+$/, 'CRO deve seguir o formato: CRO-SP 12345'),
  specialtyIds: z.array(z.string()).optional().default([]),
  commission: z.number()
    .min(0, 'Comissão deve ser no mínimo 0%')
    .max(100, 'Comissão deve ser no máximo 100%')
    .optional()
})

// Schema para editar dentista
const updateDentistFormSchema = z.object({
  cro: z.string()
    .min(1, 'CRO é obrigatório')
    .regex(/^CRO-[A-Z]{2}\s+\d+$/, 'CRO deve seguir o formato: CRO-SP 12345'),
  specialtyIds: z.array(z.string()).optional().default([]),
  commission: z.number()
    .min(0, 'Comissão deve ser no mínimo 0%')
    .max(100, 'Comissão deve ser no máximo 100%')
    .optional()
})

type CreateDentistFormData = z.infer<typeof createDentistFormSchema>
type UpdateDentistFormData = z.infer<typeof updateDentistFormSchema>

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface DentistFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dentist?: DentistOutput | null
  users: User[]
  specialties: SpecialtyOutput[]
  onSuccess: () => void
}

export function DentistFormModal({ open, onOpenChange, dentist, users, specialties, onSuccess }: DentistFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!dentist

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CreateDentistFormData | UpdateDentistFormData>({
    resolver: zodResolver(isEditing ? updateDentistFormSchema : createDentistFormSchema),
    defaultValues: {
      userId: '',
      cro: '',
      specialtyIds: [],
      commission: undefined
    }
  })

  // Reset form when modal opens/closes or dentist changes
  useEffect(() => {
    if (open) {
      if (isEditing && dentist) {
        reset({
          cro: dentist.cro,
          specialtyIds: dentist.specialties?.map(s => s.id) || [],
          commission: dentist.commission || undefined
        })
      } else {
        reset({
          userId: '',
          cro: '',
          specialtyIds: [],
          commission: undefined
        })
      }
    }
  }, [open, isEditing, dentist, reset])

  const onSubmit = async (data: CreateDentistFormData | UpdateDentistFormData) => {
    setIsSubmitting(true)
    
    try {
      const url = isEditing ? `/api/dentists/${dentist?.id}` : '/api/dentists'
      const method = isEditing ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao salvar dentista')
      }

      onSuccess()
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error('Erro ao salvar dentista:', error)
      alert(error instanceof Error ? error.message : 'Erro ao salvar dentista')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedSpecialtyIds = watch('specialtyIds') || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Dentista' : 'Novo Dentista'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Usuário (apenas para criação) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="userId">Usuário *</Label>
              <Select
                value={watch('userId') || ''}
                onValueChange={(value) => setValue('userId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(users) ? users : []).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <p className="text-sm text-destructive">{errors.userId.message}</p>
              )}
            </div>
          )}

          {/* CRO */}
          <div className="space-y-2">
            <Label htmlFor="cro">CRO *</Label>
            <Input
              id="cro"
              placeholder="Ex: CRO-SP 12345"
              {...register('cro')}
            />
            {errors.cro && (
              <p className="text-sm text-destructive">{errors.cro.message}</p>
            )}
          </div>

          {/* Especialidades */}
          <div className="space-y-2">
            <Label>Especialidades</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {(Array.isArray(specialties) ? specialties : []).map((specialty) => {
                const isChecked = selectedSpecialtyIds.includes(specialty.id)

                return (
                  <div key={specialty.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`specialty-${specialty.id}`}
                      checked={isChecked}
                      onChange={(e) => {
                        const currentIds = selectedSpecialtyIds
                        if (e.target.checked) {
                          setValue('specialtyIds', [...currentIds, specialty.id])
                        } else {
                          setValue('specialtyIds', currentIds.filter((id) => id !== specialty.id))
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={`specialty-${specialty.id}`}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {specialty.name}
                    </label>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione todas as especialidades do dentista.
            </p>
          </div>

          {/* Comissão */}
          <div className="space-y-2">
            <Label htmlFor="commission">Comissão (%)</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Ex: 30"
              {...register('commission', {
                setValueAs: (value) => value === '' ? undefined : parseFloat(value)
              })}
            />
            {errors.commission && (
              <p className="text-sm text-destructive">{errors.commission.message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}