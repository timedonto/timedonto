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

// Schema para criar dentista
const createDentistFormSchema = z.object({
  userId: z.string().min(1, 'Selecione um usuário'),
  cro: z.string()
    .min(1, 'CRO é obrigatório')
    .regex(/^CRO-[A-Z]{2}\s+\d+$/, 'CRO deve seguir o formato: CRO-SP 12345'),
  specialty: z.string().optional(),
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
  specialty: z.string().optional(),
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
  dentist?: DentistOutput
  onSuccess: () => void
}

export function DentistFormModal({ open, onOpenChange, dentist, onSuccess }: DentistFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  const isEditing = !!dentist
  const title = isEditing 
    ? `Editar Dentista - ${dentist.user.name}` 
    : 'Novo Dentista'

  // Configurar formulário baseado no modo (criar/editar)
  const schema = isEditing ? updateDentistFormSchema : createDentistFormSchema
  
  const form = useForm<CreateDentistFormData | UpdateDentistFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...(isEditing ? {} : { userId: '' }),
      cro: '',
      specialty: '',
      commission: undefined,
    },
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form

  // Buscar usuários disponíveis para criar dentista
  const fetchAvailableUsers = async () => {
    if (isEditing) return // Não precisa buscar ao editar

    try {
      setLoadingUsers(true)
      
      // Buscar usuários com role DENTIST
      const response = await fetch('/api/users?role=DENTIST')
      const data = await response.json()

      if (response.ok && data.success) {
        // Buscar dentistas existentes para filtrar
        const dentistsResponse = await fetch('/api/dentists')
        const dentistsData = await dentistsResponse.json()

        let existingDentistUserIds: string[] = []
        if (dentistsResponse.ok && dentistsData.success) {
          existingDentistUserIds = dentistsData.data.map((d: DentistOutput) => d.userId)
        }

        // Filtrar usuários que ainda não são dentistas
        const availableUsers = data.data.filter((user: User) => 
          !existingDentistUserIds.includes(user.id)
        )

        setAvailableUsers(availableUsers)
      } else {
        console.error('Erro ao buscar usuários:', data.error)
      }
    } catch (err) {
      console.error('Erro ao buscar usuários disponíveis:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Preencher formulário quando editando
  useEffect(() => {
    if (isEditing && dentist) {
      setValue('cro', dentist.cro)
      setValue('specialty', dentist.specialty || '')
      setValue('commission', dentist.commission || undefined)
    } else {
      reset({
        ...(isEditing ? {} : { userId: '' }),
        cro: '',
        specialty: '',
        commission: undefined,
      })
    }
  }, [isEditing, dentist, setValue, reset])

  // Buscar usuários quando modal abrir para criar
  useEffect(() => {
    if (open && !isEditing) {
      fetchAvailableUsers()
    }
  }, [open, isEditing])

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      reset()
    }
  }, [open, reset])

  const onSubmit = async (data: CreateDentistFormData | UpdateDentistFormData) => {
    try {
      setLoading(true)
      setError(null)

      const url = isEditing ? `/api/dentists/${dentist!.id}` : '/api/dentists'
      const method = isEditing ? 'PATCH' : 'POST'

      // Preparar dados para envio
      const submitData: any = {
        cro: data.cro,
        specialty: data.specialty || null,
        commission: data.commission || null,
      }

      // Adicionar userId apenas ao criar
      if (!isEditing && 'userId' in data) {
        submitData.userId = data.userId
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
        throw new Error(result.error || 'Erro ao salvar dentista')
      }

      // Sucesso
      onSuccess()
      onOpenChange(false)
      reset()

    } catch (err) {
      console.error('Erro ao salvar dentista:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar dentista')
    } finally {
      setLoading(false)
    }
  }

  const selectedUserId = !isEditing ? watch('userId') : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Usuário (apenas ao criar) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="userId">Usuário *</Label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando usuários...
                </div>
              ) : (
                <Select
                  value={selectedUserId || ''}
                  onValueChange={(value) => setValue('userId', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhum usuário disponível
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
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
              {...register('cro')}
              placeholder="CRO-SP 12345"
              disabled={loading}
            />
            {errors.cro && (
              <p className="text-sm text-destructive">{errors.cro.message}</p>
            )}
          </div>

          {/* Especialidade */}
          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidade</Label>
            <Input
              id="specialty"
              {...register('specialty')}
              placeholder="Ex: Ortodontia, Endodontia"
              disabled={loading}
            />
            {errors.specialty && (
              <p className="text-sm text-destructive">{errors.specialty.message}</p>
            )}
          </div>

          {/* Comissão */}
          <div className="space-y-2">
            <Label htmlFor="commission">Comissão (%)</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              max="100"
              step="0.1"
              {...register('commission', { 
                setValueAs: (value) => value === '' ? undefined : parseFloat(value) 
              })}
              placeholder="Ex: 15.5"
              disabled={loading}
            />
            {errors.commission && (
              <p className="text-sm text-destructive">{errors.commission.message}</p>
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
            <Button type="submit" disabled={loading || (!isEditing && loadingUsers)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Dentista'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}