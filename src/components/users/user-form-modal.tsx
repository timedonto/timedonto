"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { useSession } from 'next-auth/react'
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
import { UserOutput } from '@/modules/users/domain/user.schema'

// Schema para criar usuário
const createUserFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email deve ter um formato válido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Selecione um cargo válido' })
  }),
})

// Schema para editar usuário
const updateUserFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email deve ter um formato válido'),
  password: z.string().optional().refine((val) => {
    if (val && val.length > 0) {
      return val.length >= 6
    }
    return true
  }, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Selecione um cargo válido' })
  }),
  isActive: z.boolean().optional(),
})

type CreateUserFormData = z.infer<typeof createUserFormSchema>
type UpdateUserFormData = z.infer<typeof updateUserFormSchema>

interface UserFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserOutput
  onSuccess: () => void
}

// Opções de cargo base (sem OWNER)
const baseRoleOptions = [
  { value: UserRole.ADMIN, label: 'Administrador' },
  { value: UserRole.DENTIST, label: 'Dentista' },
  { value: UserRole.RECEPTIONIST, label: 'Recepcionista' },
]

// Opções completas (incluindo OWNER)
const allRoleOptions = [
  { value: UserRole.OWNER, label: 'Proprietário' },
  ...baseRoleOptions,
]

export function UserFormModal({ open, onOpenChange, user, onSuccess }: UserFormModalProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!user
  const title = isEditing ? 'Editar Usuário' : 'Novo Usuário'

  // Determinar role do usuário atual
  const currentUserRole = session?.user?.role as UserRole | undefined
  const isOwner = currentUserRole === UserRole.OWNER

  // Filtrar opções de cargo baseado no role do usuário atual
  // ADMIN não pode criar/editar OWNER
  const roleOptions = isOwner ? allRoleOptions : baseRoleOptions

  // Configurar formulário baseado no modo (criar/editar)
  const schema = isEditing ? updateUserFormSchema : createUserFormSchema

  const form = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: UserRole.RECEPTIONIST,
      ...(isEditing && { isActive: true }),
    },
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form

  // Preencher formulário quando editando
  useEffect(() => {
    if (isEditing && user) {
      setValue('name', user.name)
      setValue('email', user.email)
      setValue('role', user.role)
      setValue('isActive', user.isActive)
      // Não preencher senha ao editar
      setValue('password', '')
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        role: UserRole.RECEPTIONIST,
        isActive: true,
      })
    }
  }, [isEditing, user, setValue, reset])

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      reset()
    }
  }, [open, reset])

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    try {
      setLoading(true)
      setError(null)

      const url = isEditing ? `/api/users/${user!.id}` : '/api/users'
      const method = isEditing ? 'PATCH' : 'POST'

      // Preparar dados para envio
      const submitData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
      }

      // Adicionar senha apenas se fornecida
      if (data.password && data.password.trim() !== '') {
        submitData.password = data.password
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
        setError(result.error || 'Erro ao salvar usuário')
        return
      }

      // Sucesso
      onSuccess()
      onOpenChange(false)
      reset()

    } catch (err) {
      console.error('Erro ao salvar usuário:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário')
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = watch('role')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
            <Label htmlFor="email">Email *</Label>
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

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Senha {isEditing ? '(deixe em branco para manter)' : '*'}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder={isEditing ? 'Nova senha (opcional)' : 'Digite a senha'}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="role">Cargo *</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue('role', value as UserRole)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
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
                Usuário ativo
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
              {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}