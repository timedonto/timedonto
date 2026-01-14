"use client"

import { useState, useEffect } from 'react'
import { Loader2, DollarSign } from 'lucide-react'
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
  
  // Dados do formulário
  const [selectedPatientId, setSelectedPatientId] = useState('none')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [description, setDescription] = useState('')

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
    }
  }, [patientId, patients])

  // Limpar formulário quando modal fechar
  useEffect(() => {
    if (!open) {
      setError(null)
      setSelectedPatientId('none')
      setAmount('')
      setMethod('')
      setDescription('')
    }
  }, [open])

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
        amount: parseFloat(amount),
        method,
        patientId: selectedPatientId === 'none' ? null : selectedPatientId,
        description: description.trim() || null
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Paciente */}
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente (opcional)</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente ou deixe vazio para pagamento avulso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pagamento Avulso</SelectItem>
                  {patients.filter(p => p.id).map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        {patient.email && (
                          <div className="text-sm text-muted-foreground">{patient.email}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <div className="space-y-1">
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  disabled={loading}
                />
                {amount && (
                  <p className="text-sm text-muted-foreground">
                    Valor: {formatCurrency(amount)}
                  </p>
                )}
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="method">Método de Pagamento *</Label>
              <Select value={method} onValueChange={(value: PaymentMethod) => setMethod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método de pagamento" />
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
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Ex: Consulta, procedimento, produto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 caracteres
              </p>
            </div>

            {/* Resumo */}
            {amount && method && (
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Resumo do Pagamento</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Paciente:</span>
                    <span>
                      {selectedPatientId === 'none'
                        ? 'Pagamento Avulso'
                        : patients.find(p => p.id === selectedPatientId)?.name || 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Método:</span>
                    <span>
                      {paymentMethods.find(m => m.value === method)?.label || method}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Valor:</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                  {description && (
                    <div className="flex justify-between">
                      <span>Descrição:</span>
                      <span className="text-right max-w-48 truncate">{description}</span>
                    </div>
                  )}
                </div>
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
                Registrar Pagamento
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}