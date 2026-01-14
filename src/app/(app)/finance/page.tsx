"use client"

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Filter, Calendar } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PaymentFormModal, CashSummary } from '@/components/finance'

// Tipos para os dados da API
interface PaymentApiData {
  id: string
  clinicId: string
  patientId: string | null
  amount: number
  method: 'CASH' | 'PIX' | 'CARD'
  description: string | null
  createdAt: string
  patient?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
}

interface PaymentsApiResponse {
  success: boolean
  data?: PaymentApiData[]
  error?: string
}

type MethodFilter = 'all' | 'CASH' | 'PIX' | 'CARD'

const methodLabels = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CARD: 'Cartão'
}

const methodVariants = {
  CASH: 'success' as const,
  PIX: 'default' as const,
  CARD: 'secondary' as const
}


export default function FinancePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentApiData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  // Verificar permissões
  useEffect(() => {
    if (session?.user?.role && !['OWNER', 'ADMIN'].includes(session.user.role)) {
      router.push('/dashboard')
      return
    }
  }, [session, router])

  // Filtrar pagamentos baseado nos filtros
  const filteredPayments = useMemo(() => {
    let filtered = payments

    // Filtro por método
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.method === methodFilter)
    }

    // Filtro por período (aplicado no frontend para melhor UX)
    if (startDate || endDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.createdAt).toISOString().split('T')[0]
        
        if (startDate && paymentDate < startDate) {
          return false
        }
        
        if (endDate && paymentDate > endDate) {
          return false
        }
        
        return true
      })
    }

    return filtered
  }, [payments, methodFilter, startDate, endDate])


  // Carregar pagamentos
  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)

      // Construir URL com filtros
      const params = new URLSearchParams()
      if (methodFilter !== 'all') {
        params.append('method', methodFilter)
      }
      if (startDate) {
        params.append('startDate', new Date(startDate).toISOString())
      }
      if (endDate) {
        params.append('endDate', new Date(endDate).toISOString())
      }

      const url = `/api/payments${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      const data: PaymentsApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar pagamentos')
      }

      if (data.success && data.data) {
        setPayments(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar pagamentos')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (session?.user?.role && ['OWNER', 'ADMIN'].includes(session.user.role)) {
      fetchPayments()
    }
  }, [session])

  // Recarregar pagamentos quando filtros mudarem
  useEffect(() => {
    if (session?.user?.role && ['OWNER', 'ADMIN'].includes(session.user.role)) {
      fetchPayments()
    }
  }, [methodFilter, startDate, endDate, session])

  // Handlers para ações
  const handleCreatePayment = () => {
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    fetchPayments()
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setMethodFilter('all')
  }

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  // Não renderizar se não tiver permissão
  if (session?.user?.role && !['OWNER', 'ADMIN'].includes(session.user.role)) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie os pagamentos da clínica
          </p>
        </div>
        <Button onClick={handleCreatePayment} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Pagamento
        </Button>
      </div>

      {/* Resumo de Caixa */}
      <CashSummary />

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <div className="flex items-center space-x-4 flex-1">
            {/* Data Inicial */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
                placeholder="Data inicial"
              />
            </div>

            {/* Data Final */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
                placeholder="Data final"
              />
            </div>

            {/* Filtro de método */}
            <div className="w-48">
              <Select value={methodFilter} onValueChange={(value: MethodFilter) => setMethodFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os métodos</SelectItem>
                  <SelectItem value="CASH">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CARD">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Limpar filtros */}
            {(startDate || endDate || methodFilter !== 'all') && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Limpar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Conteúdo principal */}
      <div className="rounded-md border">
        {loading ? (
          // Estado de loading
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando pagamentos...
            </div>
          </div>
        ) : error ? (
          // Estado de erro
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Erro ao carregar pagamentos</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchPayments} variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : filteredPayments.length === 0 ? (
          // Estado vazio
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {startDate || endDate || methodFilter !== 'all' 
                  ? 'Nenhum pagamento encontrado' 
                  : 'Nenhum pagamento registrado'
                }
              </h3>
              <p className="text-muted-foreground">
                {startDate || endDate || methodFilter !== 'all'
                  ? 'Tente ajustar os filtros da busca'
                  : 'Comece registrando o primeiro pagamento da clínica'
                }
              </p>
            </div>
            {!startDate && !endDate && methodFilter === 'all' && (
              <Button onClick={handleCreatePayment} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Registrar Primeiro Pagamento
              </Button>
            )}
          </div>
        ) : (
          // Tabela de pagamentos
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {formatDate(payment.createdAt)}
                  </TableCell>
                  <TableCell>
                    {payment.patient ? (
                      <div>
                        <div className="font-medium">{payment.patient.name}</div>
                        {payment.patient.email && (
                          <div className="text-sm text-muted-foreground">
                            {payment.patient.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Avulso</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={methodVariants[payment.method]}>
                      {methodLabels[payment.method]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.description || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Resumo dos resultados */}
      {!loading && !error && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {filteredPayments.length === 1 
              ? '1 pagamento encontrado'
              : `${filteredPayments.length} pagamentos encontrados`
            }
          </div>
          {filteredPayments.length > 0 && (
            <div>
              Total: {formatCurrency(
                filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de registrar pagamento */}
      <PaymentFormModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}