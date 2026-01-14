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
import { Textarea } from '@/components/ui/textarea'
import { InventoryItemOutput } from '@/modules/inventory/domain/inventory-item.schema'

// Schema para criar item de estoque
const createInventoryItemFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  unit: z.string().min(1, 'Unidade é obrigatória').max(20, 'Unidade deve ter no máximo 20 caracteres'),
  currentQuantity: z.number().min(0, 'Quantidade atual deve ser maior ou igual a 0').int('Quantidade deve ser um número inteiro'),
  minQuantity: z.number().min(0, 'Quantidade mínima deve ser maior ou igual a 0').int('Quantidade deve ser um número inteiro').optional(),
})

// Schema para editar item de estoque
const updateInventoryItemFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  unit: z.string().min(1, 'Unidade é obrigatória').max(20, 'Unidade deve ter no máximo 20 caracteres'),
  currentQuantity: z.number().min(0, 'Quantidade atual deve ser maior ou igual a 0').int('Quantidade deve ser um número inteiro'),
  minQuantity: z.number().min(0, 'Quantidade mínima deve ser maior ou igual a 0').int('Quantidade deve ser um número inteiro').optional(),
  isActive: z.boolean().optional(),
})

type CreateInventoryItemFormData = z.infer<typeof createInventoryItemFormSchema>
type UpdateInventoryItemFormData = z.infer<typeof updateInventoryItemFormSchema>

interface InventoryItemFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItemOutput
  onSuccess: () => void
}

export function InventoryItemFormModal({ open, onOpenChange, item, onSuccess }: InventoryItemFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isEditing = !!item
  const title = isEditing ? 'Editar Item de Estoque' : 'Novo Item de Estoque'

  // Configurar formulário baseado no modo (criar/editar)
  const schema = isEditing ? updateInventoryItemFormSchema : createInventoryItemFormSchema
  
  const form = useForm<CreateInventoryItemFormData | UpdateInventoryItemFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      unit: '',
      currentQuantity: 0,
      minQuantity: undefined,
      ...(isEditing && { isActive: true }),
    },
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue } = form

  // Preencher formulário quando editando
  useEffect(() => {
    if (isEditing && item) {
      setValue('name', item.name)
      setValue('description', item.description || '')
      setValue('unit', item.unit)
      setValue('currentQuantity', item.currentQuantity)
      setValue('minQuantity', item.minQuantity || undefined)
      setValue('isActive', item.isActive)
    } else {
      reset({
        name: '',
        description: '',
        unit: '',
        currentQuantity: 0,
        minQuantity: undefined,
        isActive: true,
      })
    }
  }, [isEditing, item, setValue, reset])

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      reset()
    }
  }, [open, reset])

  const onSubmit = async (data: CreateInventoryItemFormData | UpdateInventoryItemFormData) => {
    try {
      setLoading(true)
      setError(null)

      const url = isEditing ? `/api/inventory-items/${item!.id}` : '/api/inventory-items'
      const method = isEditing ? 'PATCH' : 'POST'

      // Preparar dados para envio
      const submitData: any = {
        name: data.name,
        unit: data.unit,
        currentQuantity: data.currentQuantity,
      }

      // Adicionar campos opcionais apenas se preenchidos
      if (data.description && data.description.trim() !== '') {
        submitData.description = data.description
      }

      if (data.minQuantity !== undefined && data.minQuantity !== null) {
        submitData.minQuantity = data.minQuantity
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
        throw new Error(result.error || 'Erro ao salvar item de estoque')
      }

      // Sucesso
      onSuccess()
      onOpenChange(false)
      reset()

    } catch (err) {
      console.error('Erro ao salvar item de estoque:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar item de estoque')
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
              placeholder="Digite o nome do item"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição detalhada do item (opcional)"
              disabled={loading}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Unidade */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Input
              id="unit"
              {...register('unit')}
              placeholder="Ex: caixa, unidade, pacote, frasco"
              disabled={loading}
            />
            {errors.unit && (
              <p className="text-sm text-destructive">{errors.unit.message}</p>
            )}
          </div>

          {/* Quantidade Atual */}
          <div className="space-y-2">
            <Label htmlFor="currentQuantity">Quantidade Atual *</Label>
            <Input
              id="currentQuantity"
              type="number"
              min="0"
              step="1"
              {...register('currentQuantity', { valueAsNumber: true })}
              placeholder="0"
              disabled={loading}
            />
            {errors.currentQuantity && (
              <p className="text-sm text-destructive">{errors.currentQuantity.message}</p>
            )}
          </div>

          {/* Quantidade Mínima */}
          <div className="space-y-2">
            <Label htmlFor="minQuantity">Quantidade Mínima</Label>
            <Input
              id="minQuantity"
              type="number"
              min="0"
              step="1"
              {...register('minQuantity', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              placeholder="Para alerta de estoque baixo (opcional)"
              disabled={loading}
            />
            {errors.minQuantity && (
              <p className="text-sm text-destructive">{errors.minQuantity.message}</p>
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
                Item ativo
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
              {isEditing ? 'Salvar Alterações' : 'Criar Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}