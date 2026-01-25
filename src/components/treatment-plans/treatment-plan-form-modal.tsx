"use client"

import { useState, useEffect } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
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

// Tipos para os dados da API
interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface Dentist {
  id: string
  cro: string
  specialty: string | null
  user: {
    id: string
    name: string
    email: string
  }
}

interface Procedure {
  id: string
  name: string
  description: string | null
  baseValue: number
  commissionPercentage: number
  isActive: boolean
  specialty: {
    id: string
    name: string
  }
}

interface TreatmentItem {
  procedureId: string | null
  description: string
  value: number
  quantity: number
}

interface TreatmentPlanApiData {
  id: string
  clinicId: string
  patientId: string
  dentistId: string
  status: 'OPEN' | 'APPROVED' | 'REJECTED'
  totalAmount: number
  notes: string | null
  createdAt: string
  updatedAt: string
  items: {
    id: string
    planId: string
    description: string
    tooth: string | null
    value: number
    quantity: number
  }[]
}

interface TreatmentPlanFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  patientId?: string
  treatmentPlan?: TreatmentPlanApiData
}

export function TreatmentPlanFormModal({
  open,
  onOpenChange,
  onSuccess,
  patientId,
  treatmentPlan,
}: TreatmentPlanFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isEditing = !!treatmentPlan
  
  // Dados dos selects
  const [patients, setPatients] = useState<Patient[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loadingProcedures, setLoadingProcedures] = useState(false)
  
  // Dados do formulário
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedDentistId, setSelectedDentistId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<TreatmentItem[]>([
    { procedureId: null, description: '', value: 0, quantity: 1 }
  ])
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED' | null>(null)
  const [discountValue, setDiscountValue] = useState<number | null>(null)

  // Carregar pacientes e dentistas
  const loadData = async () => {
    try {
      setLoadingData(true)
      setError(null)

      const [patientsResponse, dentistsResponse] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/dentists')
      ])

      const patientsData = await patientsResponse.json()
      const dentistsData = await dentistsResponse.json()

      if (!patientsResponse.ok || !patientsData.success) {
        throw new Error(patientsData.error || 'Erro ao carregar pacientes')
      }

      if (!dentistsResponse.ok || !dentistsData.success) {
        throw new Error(dentistsData.error || 'Erro ao carregar dentistas')
      }

      setPatients(patientsData.data || [])
      setDentists(dentistsData.data || [])

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoadingData(false)
    }
  }

  // Carregar procedimentos quando dentista for selecionado
  const loadProcedures = async (dentistId: string) => {
    if (!dentistId) {
      setProcedures([])
      return
    }

    try {
      setLoadingProcedures(true)
      setError(null)

      const response = await fetch(`/api/dentists/${dentistId}/procedures`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao carregar procedimentos' }))
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar procedimentos')
      }

      // Garantir que data.data é um array
      const proceduresList = Array.isArray(data.data) ? data.data : []
      setProcedures(proceduresList)
    } catch (err) {
      console.error('Erro ao carregar procedimentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar procedimentos')
      setProcedures([])
    } finally {
      setLoadingProcedures(false)
    }
  }

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  // Carregar procedimentos quando dentista mudar
  useEffect(() => {
    if (selectedDentistId) {
      loadProcedures(selectedDentistId)
    } else {
      setProcedures([])
    }
  }, [selectedDentistId])

  // Carregar dados do orçamento quando em modo de edição
  useEffect(() => {
    if (open && treatmentPlan) {
      setSelectedPatientId(treatmentPlan.patientId)
      setSelectedDentistId(treatmentPlan.dentistId)
      setNotes(treatmentPlan.notes || '')
      setItems(treatmentPlan.items.map(item => ({
        procedureId: item.procedureId,
        description: item.description,
        value: item.value,
        quantity: item.quantity
      })))
    }
  }, [open, treatmentPlan])

  // Pré-selecionar paciente se fornecido (apenas em modo de criação)
  useEffect(() => {
    if (!isEditing && patientId && patients.length > 0) {
      const patient = patients.find(p => p.id === patientId)
      if (patient) {
        setSelectedPatientId(patientId)
      }
    } else if (!isEditing && patientId) {
      setSelectedPatientId(patientId)
    }
  }, [patientId, patients, isEditing])

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      if (!treatmentPlan) {
        setSelectedPatientId(patientId || '')
        setSelectedDentistId('')
        setNotes('')
        setItems([{ procedureId: null, description: '', value: 0, quantity: 1 }])
        setDiscountType(null)
        setDiscountValue(null)
        setProcedures([])
      }
    }
  }, [open, patientId, treatmentPlan])

  // Calcular valor total
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.value * item.quantity)
  }, 0)

  // Calcular valor final com desconto
  const calculateFinalAmount = (): number => {
    if (!discountType || discountValue === null || discountValue === undefined) {
      return totalAmount
    }

    if (discountType === 'PERCENTAGE') {
      const discount = (totalAmount * discountValue) / 100
      return Math.max(0, totalAmount - discount)
    } else {
      // FIXED
      return Math.max(0, totalAmount - discountValue)
    }
  }

  const finalAmount = calculateFinalAmount()

  // Adicionar novo item
  const addItem = () => {
    setItems([...items, { procedureId: null, description: '', value: 0, quantity: 1 }])
  }

  // Auto-preenchimento quando procedimento for selecionado
  const handleProcedureSelect = (index: number, procedureId: string) => {
    const procedure = procedures.find(p => p.id === procedureId)
    if (!procedure) return

    const updatedItems = [...items]
    updatedItems[index] = {
      ...updatedItems[index],
      procedureId: procedure.id,
      description: procedure.name,
      value: procedure.baseValue
    }
    setItems(updatedItems)
  }

  // Remover item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  // Atualizar item
  const updateItem = (index: number, field: keyof TreatmentItem, value: string | number) => {
    // Não permitir edição manual de valor quando há procedureId
    if (field === 'value' && items[index].procedureId) {
      return
    }
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  // Validar formulário
  const validateForm = () => {
    // Em modo de edição, paciente e dentista já estão definidos
    if (!isEditing) {
      if (!selectedPatientId) {
        setError('Selecione um paciente')
        return false
      }

      if (!selectedDentistId) {
        setError('Selecione um dentista')
        return false
      }
    }

    if (items.length === 0) {
      setError('Adicione pelo menos um item')
      return false
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.description.trim()) {
        setError(`Item ${i + 1}: Descrição é obrigatória`)
        return false
      }
      if (item.value < 0) {
        setError(`Item ${i + 1}: Valor não pode ser negativo`)
        return false
      }
      if (item.quantity <= 0) {
        setError(`Item ${i + 1}: Quantidade deve ser maior que zero`)
        return false
      }
    }

    return true
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Validar se pode editar (apenas orçamentos em aberto)
    if (isEditing && treatmentPlan && treatmentPlan.status !== 'OPEN') {
      setError('Não é possível editar um orçamento aprovado ou rejeitado')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (isEditing && treatmentPlan) {
        // Modo de edição - atualizar orçamento existente
        const submitData = {
          notes: notes.trim() || null,
          items: items.map(item => ({
            description: item.description.trim(),
            value: item.value,
            quantity: item.quantity
          }))
        }

        const response = await fetch(`/api/treatment-plans/${treatmentPlan.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao atualizar orçamento')
        }

        // Sucesso
        onSuccess()
        onOpenChange(false)
      } else {
        // Modo de criação - criar novo orçamento
        // Validar que todos os itens têm descrição e valor
        const validItems = items.filter(item => {
          return item.description.trim().length > 0 && item.value > 0
        })

        if (validItems.length === 0) {
          setError('Adicione pelo menos um item válido ao orçamento')
          return
        }

        const submitData = {
          patientId: selectedPatientId,
          dentistId: selectedDentistId,
          notes: notes.trim() || null,
          items: validItems.map(item => ({
            procedureId: item.procedureId && item.procedureId.trim() !== '' ? item.procedureId : null,
            description: item.description.trim(),
            value: Number(item.value),
            quantity: Number(item.quantity) || 1
          })),
          discountType: discountType || null,
          discountValue: discountValue !== null && discountValue !== undefined ? Number(discountValue) : null
        }

        console.log('Dados a serem enviados:', submitData)

        const response = await fetch('/api/treatment-plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          console.error('Erro ao criar orçamento - Status:', response.status)
          console.error('Erro ao criar orçamento - Resposta:', result)
          const errorMessage = result.error || `Erro ao criar orçamento (${response.status})`
          throw new Error(errorMessage)
        }

        // Sucesso
        onSuccess()
        onOpenChange(false)
      }

    } catch (err) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} orçamento:`, err)
      setError(err instanceof Error ? err.message : `Erro ao ${isEditing ? 'atualizar' : 'criar'} orçamento`)
    } finally {
      setLoading(false)
    }
  }

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando dados...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Seleção de Paciente e Dentista */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Paciente */}
              <div className="space-y-2">
                <Label htmlFor="patient" className="text-xs sm:text-sm">Paciente *</Label>
                <Select 
                  value={selectedPatientId} 
                  onValueChange={setSelectedPatientId}
                  disabled={!!patientId || isEditing}
                >
                  <SelectTrigger className="h-11 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div className="text-left">
                          <div className="font-medium text-sm">{patient.name}</div>
                          {patient.email && (
                            <div className="text-xs text-muted-foreground">{patient.email}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dentista */}
              <div className="space-y-2">
                <Label htmlFor="dentist" className="text-xs sm:text-sm">Dentista *</Label>
                <Select 
                  value={selectedDentistId} 
                  onValueChange={(value) => {
                    setSelectedDentistId(value)
                    // Limpar itens quando mudar o dentista
                    setItems([{ procedureId: null, description: '', value: 0, quantity: 1 }])
                  }} 
                  disabled={isEditing}
                >
                  <SelectTrigger className="h-11 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Selecione um dentista" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists.map((dentist) => (
                      <SelectItem key={dentist.id} value={dentist.id}>
                        <div className="text-left">
                          <div className="font-medium text-sm">{dentist.user.name}</div>
                          <div className="text-xs text-muted-foreground">CRO: {dentist.cro}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDentistId && loadingProcedures && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Carregando procedimentos...
                  </p>
                )}
                {selectedDentistId && !loadingProcedures && procedures.length === 0 && (
                  <p className="text-xs text-warning">
                    Este dentista não possui procedimentos vinculados
                  </p>
                )}
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm sm:text-base font-medium">Itens do Orçamento</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="flex items-center gap-2 h-9"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar Item</span>
                  <span className="sm:hidden text-xs">Item</span>
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Procedimento */}
                      <div className="space-y-1">
                        <Label className="text-[10px] sm:text-xs uppercase font-bold text-slate-500">Procedimento *</Label>
                        <Select
                          value={item.procedureId || ''}
                          onValueChange={(value) => handleProcedureSelect(index, value)}
                          disabled={loading || loadingProcedures || !selectedDentistId}
                        >
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue 
                              placeholder={
                                !selectedDentistId 
                                  ? "Selecione o dentista primeiro" 
                                  : loadingProcedures 
                                    ? "Carregando procedimentos..." 
                                    : procedures.length === 0
                                      ? "Nenhum procedimento disponível"
                                      : "Selecione um procedimento"
                              } 
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingProcedures ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                Carregando...
                              </div>
                            ) : procedures.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                Nenhum procedimento vinculado a este dentista
                              </div>
                            ) : (
                              procedures.map((procedure) => (
                                <SelectItem key={procedure.id} value={procedure.id}>
                                  <div className="text-left">
                                    <div className="font-medium text-sm">{procedure.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatCurrency(procedure.baseValue)}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {item.procedureId && (
                          <Input
                            value={item.description}
                            readOnly
                            className="h-10 text-sm mt-2 bg-muted"
                          />
                        )}
                      </div>

                      {/* Valor Unitário */}
                      <div className="space-y-1">
                        <Label className="text-[10px] sm:text-xs uppercase font-bold text-slate-500">Valor *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={item.value || ''}
                          onChange={(e) => updateItem(index, 'value', parseFloat(e.target.value) || 0)}
                          disabled={loading || !!item.procedureId}
                          readOnly={!!item.procedureId}
                          className="h-10 text-sm bg-muted"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {/* Quantidade */}
                      <div className="space-y-1">
                        <Label className="text-[10px] sm:text-xs uppercase font-bold text-slate-500">Qtd *</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          disabled={loading}
                          className="h-10 text-sm"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="space-y-1">
                        <Label className="text-[10px] sm:text-xs uppercase font-bold text-slate-500">Subtotal</Label>
                        <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center text-sm font-bold text-primary">
                          {formatCurrency(item.value * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Geral */}
              <div className="border-t pt-4 bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-medium">Total Geral:</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs sm:text-sm">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-xs sm:text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full sm:w-auto order-2 sm:order-1 h-11 sm:h-10"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || (isEditing && treatmentPlan?.status !== 'OPEN')} className="w-full sm:w-auto order-1 sm:order-2 h-11 sm:h-10">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
