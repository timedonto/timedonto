"use client"

import { useState, useEffect } from 'react'
import { Loader2, DollarSign, FileText, Check } from 'lucide-react'
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

// Tipos para os dados da API
interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface TreatmentPlan {
  id: string
  status: 'OPEN' | 'APPROVED' | 'REJECTED'
  totalAmount: number
  discountType: 'PERCENTAGE' | 'FIXED' | null
  discountValue: number | null
  finalAmount: number
  notes: string | null
  createdAt: string
  patient: {
    id: string
    name: string
  }
  dentist: {
    id: string
    user: {
      name: string
    }
  }
  items: Array<{
    id: string
    description: string
    tooth: string | null
    value: number
    quantity: number
  }>
}

type PaymentMethod = 'CASH' | 'PIX' | 'CARD'

interface PaymentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  patientId?: string
}

const paymentMethods = [
  { value: 'CASH', label: 'Dinheiro', icon: '💵' },
  { value: 'PIX', label: 'PIX', icon: '📱' },
  { value: 'CARD', label: 'Cartão', icon: '💳' }
] as const

export function PaymentFormModal({ open, onOpenChange, onSuccess, patientId }: PaymentFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dados dos selects
  const [patients, setPatients] = useState<Patient[]>([])
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
  
  // Dados do formulário
  const [selectedPatientId, setSelectedPatientId] = useState('none')
  const [selectedTreatmentPlanIds, setSelectedTreatmentPlanIds] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED' | null>(null)
  const [discountValue, setDiscountValue] = useState<number | null>(null)

  // Carregar pacientes
  const loadPatients = async () => {
    try {
      setLoadingData(true)
      setError(null)

      const response = await fetch('/api/patients')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar pacientes')
      }

      setPatients(data.data || [])

    } catch (err) {
      console.error('Erro ao carregar pacientes:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoadingData(false)
    }
  }

  // Carregar orçamentos do paciente
  const loadTreatmentPlans = async (patientId: string) => {
    try {
      setLoadingData(true)
      setError(null)

      // Fazer duas requisições para buscar orçamentos OPEN e APPROVED
      const [openResponse, approvedResponse] = await Promise.all([
        fetch(`/api/treatment-plans?patientId=${patientId}&status=OPEN`),
        fetch(`/api/treatment-plans?patientId=${patientId}&status=APPROVED`)
      ])

      const [openData, approvedData] = await Promise.all([
        openResponse.json(),
        approvedResponse.json()
      ])

      if (!openResponse.ok || !openData.success) {
        throw new Error(openData.error || 'Erro ao carregar orçamentos em aberto')
      }

      if (!approvedResponse.ok || !approvedData.success) {
        throw new Error(approvedData.error || 'Erro ao carregar orçamentos aprovados')
      }

      // Combinar os resultados
      const allPlans = [...(openData.data || []), ...(approvedData.data || [])]
      
      setTreatmentPlans(allPlans)

    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamentos')
    } finally {
      setLoadingData(false)
    }
  }

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (open) {
      loadPatients()
    }
  }, [open])

  // Pré-selecionar paciente se fornecido
  useEffect(() => {
    if (patientId && patients.length > 0) {
      const patient = patients.find(p => p.id === patientId)
      if (patient) {
        setSelectedPatientId(patientId)
      }
    } else if (patientId) {
      setSelectedPatientId(patientId)
    }
  }, [patientId, patients])

  // Carregar orçamentos quando paciente for selecionado
  useEffect(() => {
    if (selectedPatientId && selectedPatientId !== 'none') {
      loadTreatmentPlans(selectedPatientId)
    } else {
      setTreatmentPlans([])
      setSelectedTreatmentPlanIds([])
    }
  }, [selectedPatientId])

  // Calcular amount automaticamente quando orçamentos são selecionados
  useEffect(() => {
    if (selectedTreatmentPlanIds.length > 0) {
      const total = treatmentPlans
        .filter(plan => selectedTreatmentPlanIds.includes(plan.id))
        .reduce((sum, plan) => sum + (plan.finalAmount || plan.totalAmount), 0)
      setAmount(total.toFixed(2))
    } else if (selectedPatientId === 'none') {
      // Se não há paciente selecionado, limpar amount para permitir entrada manual
      setAmount('')
    }
  }, [selectedTreatmentPlanIds, treatmentPlans, selectedPatientId])

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      setSelectedPatientId(patientId || 'none')
      setSelectedTreatmentPlanIds([])
      setTreatmentPlans([])
      setAmount('')
      setMethod('')
      setDescription('')
      setDiscountType(null)
      setDiscountValue(null)
    }
  }, [open, patientId])

  // Calcular valor final com desconto
  const calculateFinalAmount = (): number => {
    const originalAmount = parseFloat(amount) || 0
    if (originalAmount === 0) return 0
    
    if (!discountType || discountValue === null || discountValue === undefined) {
      return originalAmount
    }

    if (discountType === 'PERCENTAGE') {
      const discount = (originalAmount * discountValue) / 100
      return Math.max(0, originalAmount - discount)
    } else {
      // FIXED
      return Math.max(0, originalAmount - discountValue)
    }
  }

  const finalAmount = calculateFinalAmount()
  const hasTreatmentPlans = selectedTreatmentPlanIds.length > 0

  // Validar formulário
  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Valor deve ser maior que zero')
      return false
    }

    if (!method) {
      setError('Selecione um método de pagamento')
      return false
    }

    // Validar desconto
    if (discountType && (discountValue === null || discountValue === undefined)) {
      setError('Informe o valor do desconto')
      return false
    }

    if (discountType === 'PERCENTAGE' && (discountValue! < 0 || discountValue! > 100)) {
      setError('Desconto percentual deve estar entre 0% e 100%')
      return false
    }

    if (discountType === 'FIXED' && discountValue! > parseFloat(amount)) {
      setError('Desconto fixo não pode exceder o valor do pagamento')
      return false
    }

    return true
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const submitData = {
        amount: hasTreatmentPlans ? undefined : parseFloat(amount), // Opcional quando há orçamentos
        method,
        patientId: selectedPatientId === 'none' ? null : selectedPatientId,
        description: description.trim() || null,
        treatmentPlanIds: selectedTreatmentPlanIds.length > 0 ? selectedTreatmentPlanIds : undefined,
        discountType: discountType || null,
        discountValue: discountValue ?? null
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao registrar pagamento')
      }

      // Sucesso
      onSuccess()
      onOpenChange(false)

    } catch (err) {
      console.error('Erro ao registrar pagamento:', err)
      setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento')
    } finally {
      setLoading(false)
    }
  }

  // Formatar valor monetário para exibição
  const formatCurrency = (value: string) => {
    if (!value) return 'R$ 0,00'
    const numValue = parseFloat(value) || 0
    return numValue.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  }

  // Handler para mudança no valor
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Permitir apenas números e ponto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  // Handler para seleção/deseleção de orçamento
  const handleTreatmentPlanToggle = (treatmentPlanId: string) => {
    setSelectedTreatmentPlanIds(prev => {
      if (prev.includes(treatmentPlanId)) {
        return prev.filter(id => id !== treatmentPlanId)
      } else {
        return [...prev, treatmentPlanId]
      }
    })
  }

  // Calcular total dos orçamentos selecionados (usando finalAmount)
  const getSelectedTreatmentPlansTotal = () => {
    return treatmentPlans
      .filter(plan => selectedTreatmentPlanIds.includes(plan.id))
      .reduce((sum, plan) => sum + (plan.finalAmount || plan.totalAmount), 0)
  }

  // Formatar valor para exibição
  const formatCurrencyValue = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <DollarSign className="h-5 w-5 text-primary" />
            Registrar Pagamento
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
            {/* Seleção de Paciente */}
            <div className="space-y-2">
              <Label htmlFor="patient" className="text-xs sm:text-sm font-medium">Paciente *</Label>
              <Select 
                value={selectedPatientId} 
                onValueChange={setSelectedPatientId}
                disabled={!!patientId}
              >
                <SelectTrigger className="h-11 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pagamento Avulso (Sem Paciente)</SelectItem>
                  {patients.filter(p => p.id).map((patient) => (
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

            {/* Seleção de Orçamentos */}
            {selectedPatientId !== 'none' && (
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">
                  Orçamentos Associados (opcional)
                </Label>
                {treatmentPlans.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum orçamento disponível para este paciente
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apenas orçamentos em aberto ou aprovados podem ser associados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Selecione os orçamentos que este pagamento deve cobrir:
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-2">
                      {treatmentPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedTreatmentPlanIds.includes(plan.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-muted hover:border-muted-foreground/25'
                          }`}
                          onClick={() => handleTreatmentPlanToggle(plan.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  selectedTreatmentPlanIds.includes(plan.id)
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground/25'
                                }`}>
                                  {selectedTreatmentPlanIds.includes(plan.id) && (
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  plan.status === 'OPEN'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {plan.status === 'OPEN' ? 'Em Aberto' : 'Aprovado'}
                                </span>
                              </div>
                              <div className="text-sm font-medium mb-1">
                                {formatCurrencyValue(plan.totalAmount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {plan.items.length} item(s) • Dr. {plan.dentist.user.name}
                              </div>
                              {plan.notes && (
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                  {plan.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedTreatmentPlanIds.length > 0 && (
                      <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Total dos orçamentos selecionados:
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrencyValue(getSelectedTreatmentPlansTotal())}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs sm:text-sm font-medium">
                Valor {hasTreatmentPlans ? '(calculado automaticamente)' : '*'}
              </Label>
              <div className="space-y-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="0.00"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={loading || hasTreatmentPlans}
                    readOnly={hasTreatmentPlans}
                    className={`pl-9 h-11 sm:h-10 text-sm sm:text-base font-medium ${hasTreatmentPlans ? 'bg-muted' : ''}`}
                  />
                </div>
                {hasTreatmentPlans && (
                  <p className="text-xs text-muted-foreground">
                    Valor calculado automaticamente dos orçamentos selecionados
                  </p>
                )}
                {amount && !hasTreatmentPlans && (
                  <p className="text-xs text-primary font-bold">
                    Extenso: {formatCurrency(amount)}
                  </p>
                )}
              </div>
            </div>

            {/* Desconto */}
            {amount && parseFloat(amount) > 0 && (
              <div className="space-y-2 border-t pt-4">
                <Label className="text-xs sm:text-sm font-medium">Desconto (opcional)</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="payment-discount-percentage"
                      name="paymentDiscountType"
                      value="PERCENTAGE"
                      checked={discountType === 'PERCENTAGE'}
                      onChange={(e) => {
                        setDiscountType(e.target.checked ? 'PERCENTAGE' : null)
                        if (!e.target.checked) {
                          setDiscountValue(null)
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="payment-discount-percentage" className="font-normal cursor-pointer">Percentual (%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="payment-discount-fixed"
                      name="paymentDiscountType"
                      value="FIXED"
                      checked={discountType === 'FIXED'}
                      onChange={(e) => {
                        setDiscountType(e.target.checked ? 'FIXED' : null)
                        if (!e.target.checked) {
                          setDiscountValue(null)
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="payment-discount-fixed" className="font-normal cursor-pointer">Valor Fixo (R$)</Label>
                  </div>
                  {discountType && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDiscountType(null)
                        setDiscountValue(null)
                      }}
                      className="h-8 text-xs"
                    >
                      Remover
                    </Button>
                  )}
                </div>

                {discountType && (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      min="0"
                      step={discountType === 'PERCENTAGE' ? '0.01' : '0.01'}
                      max={discountType === 'PERCENTAGE' ? '100' : undefined}
                      placeholder={discountType === 'PERCENTAGE' ? '0.00' : '0,00'}
                      value={discountValue || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setDiscountValue(val)
                      }}
                      disabled={loading}
                      className="h-10 text-sm"
                    />
                    {discountType === 'PERCENTAGE' && discountValue && (
                      <p className="text-xs text-muted-foreground">
                        Desconto: {formatCurrencyValue((parseFloat(amount) * discountValue) / 100)}
                      </p>
                    )}
                  </div>
                )}

                {discountType && discountValue !== null && (
                  <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Valor original:</span>
                      <span className="font-medium">{formatCurrencyValue(parseFloat(amount))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="font-medium text-destructive">
                        -{formatCurrencyValue(
                          discountType === 'PERCENTAGE'
                            ? (parseFloat(amount) * discountValue) / 100
                            : discountValue
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t font-bold">
                      <span>Valor final:</span>
                      <span className="text-lg text-primary">{formatCurrencyValue(finalAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Método de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="method" className="text-xs sm:text-sm font-medium">Método de Pagamento *</Label>
              <Select value={method} onValueChange={(value: PaymentMethod) => setMethod(value)}>
                <SelectTrigger className="h-11 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((paymentMethod) => (
                    <SelectItem key={paymentMethod.value} value={paymentMethod.value}>
                      <div className="flex items-center gap-2">
                        <span>{paymentMethod.icon}</span>
                        <span>{paymentMethod.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Ex: Consulta, restauração..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                maxLength={500}
                className="h-11 sm:h-10 text-sm sm:text-base"
              />
              <p className="text-[10px] text-right text-muted-foreground">
                {description.length}/500 caracteres
              </p>
            </div>

            {/* Resumo (Opcional - só mostra se tiver valores) */}
            {amount && method && (
              <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Resumo do Lançamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Paciente:</span>
                    <span className="font-medium">
                      {selectedPatientId === 'none'
                        ? 'Avulso'
                        : patients.find(p => p.id === selectedPatientId)?.name || 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Método:</span>
                    <span className="font-medium">
                      {paymentMethods.find(m => m.value === method)?.label || method}
                    </span>
                  </div>
                  {selectedTreatmentPlanIds.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Orçamentos:</span>
                      <span className="font-medium">
                        {selectedTreatmentPlanIds.length} selecionado(s)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-lg text-primary">
                      {discountType && discountValue !== null
                        ? formatCurrencyValue(finalAmount)
                        : formatCurrency(amount)}
                    </span>
                  </div>
                  {discountType && discountValue !== null && (
                    <div className="text-xs text-muted-foreground pt-1">
                      Valor original: {formatCurrencyValue(parseFloat(amount))} | Desconto aplicado
                    </div>
                  )}
                  {selectedTreatmentPlanIds.length > 0 && (
                    <div className="text-xs text-muted-foreground pt-1">
                      * Orçamentos em aberto serão automaticamente aprovados
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-xs sm:text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full sm:w-auto order-2 sm:order-1 h-11 sm:h-10"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto order-1 sm:order-2 h-11 sm:h-10">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Pagamento
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
