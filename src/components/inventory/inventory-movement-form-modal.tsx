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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InventoryItemOutput } from '@/modules/inventory/domain/inventory-item.schema'

// Schema para criar movimentação de estoque
const createInventoryMovementFormSchema = z.object({
  itemId: z.string().min(1, 'Item é obrigatório'),
  type: z.enum(['IN', 'OUT'], { message: 'Tipo é obrigatório' }),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0').int('Quantidade deve ser um número inteiro'),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

type CreateInventoryMovementFormData = z.infer<typeof createInventoryMovementFormSchema>

interface InventoryMovementFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: InventoryItemOutput[]
  onSuccess: () => void
}

export function InventoryMovementFormModal({ open, onOpenChange, items, onSuccess }: InventoryMovementFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const title = 'Nova Movimentação de Estoque'

  const form = useForm<CreateInventoryMovementFormData>({
    resolver: zodResolver(createInventoryMovementFormSchema),
    defaultValues: {
      itemId: '',
      type: undefined,
      quantity: 1,
      notes: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form

  // Observar mudanças no item selecionado para mostrar informações
  const selectedItemId = watch('itemId')
  const selectedItem = items.find(item => item.id === selectedItemId)

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      reset({
        itemId: '',
        type: undefined,
        quantity: 1,
        notes: '',
      })
    }
  }, [open, reset])

  const onSubmit = async (data: CreateInventoryMovementFormData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/inventory-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao registrar movimentação')
      }

      // Sucesso
      onSuccess()
      onOpenChange(false)
      reset()

    } catch (err) {
      console.error('Erro ao registrar movimentação:', err)
      setError(err instanceof Error ? err.message : 'Erro ao registrar movimentação')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar apenas itens ativos
  const activeItems = items.filter(item => item.isActive)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Item */}
          <div className="space-y-2">
            <Label htmlFor="itemId">Item *</Label>
            <Select
              value={selectedItemId}
              onValueChange={(value) => setValue('itemId', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um item" />
              </SelectTrigger>
              <SelectContent>
                {activeItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Estoque atual: {item.currentQuantity} {item.unit}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.itemId && (
              <p className="text-sm text-destructive">{errors.itemId.message}</p>
            )}
            {selectedItem && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                <strong>Estoque atual:</strong> {selectedItem.currentQuantity} {selectedItem.unit}
                {selectedItem.minQuantity && (
                  <>
                    <br />
                    <strong>Estoque mínimo:</strong> {selectedItem.minQuantity} {selectedItem.unit}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select
              onValueChange={(value) => setValue('type', value as 'IN' | 'OUT')}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Entrada
                  </div>
                </SelectItem>
                <SelectItem value="OUT">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Saída
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              {...register('quantity', { valueAsNumber: true })}
              placeholder="Digite a quantidade"
              disabled={loading}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre a movimentação (opcional)"
              disabled={loading}
              rows={3}
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Movimentação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}