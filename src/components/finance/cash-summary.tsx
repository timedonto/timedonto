"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, DollarSign, Banknote, QrCode, CreditCard, Calendar, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format, parseISO } from 'date-fns'

// Tipos para os dados da API
interface PaymentSummary {
  method: 'CASH' | 'PIX' | 'CARD'
  total: number
  count: number
}

interface DailySummary {
  date: string
  totalAmount: number
  totalCount: number
  byMethod: PaymentSummary[]
}

interface MonthlySummary {
  year: number
  month: number
  totalAmount: number
  totalCount: number
  byMethod: PaymentSummary[]
}

interface SummaryApiResponse {
  success: boolean
  data?: DailySummary | MonthlySummary
  error?: string
}

interface CashSummaryProps {
  clinicId?: string
}

type ViewType = 'daily' | 'monthly'

const methodIcons = {
  CASH: Banknote,
  PIX: QrCode,
  CARD: CreditCard
}

const methodLabels = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CARD: 'Cartão'
}

export function CashSummary({ clinicId }: CashSummaryProps) {
  const { data: session } = useSession()
  const [viewType, setViewType] = useState<ViewType>('daily')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<DailySummary | MonthlySummary | null>(null)
  
  // Estados para seleção de data/período
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] // YYYY-MM-DD
  })
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)

  // Usar clinicId da sessão se não fornecido
  const effectiveClinicId = clinicId || session?.user?.clinicId

  // Buscar resumo
  const fetchSummary = async () => {
    if (!effectiveClinicId) return

    try {
      setLoading(true)
      setError(null)

      let url = '/api/payments/summary'
      const params = new URLSearchParams()
      
      if (viewType === 'daily') {
        params.append('type', 'daily')
        if (selectedDate) {
          const normalizedDate = format(parseISO(selectedDate), 'yyyy-MM-dd')
          params.append('date', normalizedDate)
          console.log('CashSummary fetch date', normalizedDate)
        }
      } else {
        params.append('type', 'monthly')
        params.append('year', selectedYear.toString())
        params.append('month', selectedMonth.toString())
      }

      url += `?${params.toString()}`
      
      const response = await fetch(url)
      const data: SummaryApiResponse = await response.json()
      console.log('cash summary fetch', {
        url,
        status: response.status,
        payload: data
      })

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar resumo')
      }

      if (data.success && data.data) {
        setSummary(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar resumo:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar resumo')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados quando componente montar ou parâmetros mudarem
  useEffect(() => {
    if (effectiveClinicId) {
      fetchSummary()
    }
  }, [effectiveClinicId, viewType, selectedDate, selectedYear, selectedMonth])

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  }

  // Obter total por método
  const getMethodTotal = (method: 'CASH' | 'PIX' | 'CARD'): number => {
    if (!summary) return 0
    const methodSummary = summary.byMethod.find(m => m.method === method)
    return methodSummary?.total || 0
  }

  // Gerar opções de anos (últimos 5 anos + próximos 2)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i)
    }
    return years
  }

  // Gerar opções de meses
  const getMonthOptions = () => [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ]

  // Obter título do período
  const getPeriodTitle = () => {
    if (viewType === 'daily') {
      if (selectedDate) {
        const date = new Date(selectedDate + 'T00:00:00')
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
      return 'Hoje'
    } else {
      const monthName = getMonthOptions().find(m => m.value === selectedMonth)?.label
      return `${monthName} ${selectedYear}`
    }
  }

  if (!effectiveClinicId) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:gap-2">
          <h3 className="text-base sm:text-lg font-semibold">Resumo de Caixa</h3>
          <span className="text-xs sm:text-sm text-muted-foreground">({getPeriodTitle()})</span>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:gap-2">
          {/* Toggle Diário/Mensal */}
          <div className="flex rounded-md border">
            <Button
              variant={viewType === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('daily')}
              className="rounded-r-none text-xs sm:text-sm"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Diário</span>
              <span className="sm:hidden">Dia</span>
            </Button>
            <Button
              variant={viewType === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('monthly')}
              className="rounded-l-none text-xs sm:text-sm"
            >
              <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Mensal</span>
              <span className="sm:hidden">Mês</span>
            </Button>
          </div>

          {/* Seletor de período */}
          {viewType === 'daily' ? (
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-40 text-xs sm:text-sm"
            />
          ) : (
            <div className="flex gap-2">
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-20 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Geral */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total {viewType === 'daily' ? 'do Dia' : 'do Mês'}
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
              ) : error ? (
                <span className="text-destructive text-xs sm:text-sm">Erro</span>
              ) : (
                formatCurrency(summary?.totalAmount || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.totalCount || 0} transações
            </p>
          </CardContent>
        </Card>

        {/* Dinheiro */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Dinheiro</CardTitle>
            <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
              ) : error ? (
                <span className="text-destructive text-xs sm:text-sm">Erro</span>
              ) : (
                formatCurrency(getMethodTotal('CASH'))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Pagamentos em dinheiro</span>
              <span className="sm:hidden">Dinheiro</span>
            </p>
          </CardContent>
        </Card>

        {/* PIX */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">PIX</CardTitle>
            <QrCode className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
              ) : error ? (
                <span className="text-destructive text-xs sm:text-sm">Erro</span>
              ) : (
                formatCurrency(getMethodTotal('PIX'))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Pagamentos via PIX</span>
              <span className="sm:hidden">PIX</span>
            </p>
          </CardContent>
        </Card>

        {/* Cartão */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Cartão</CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
              ) : error ? (
                <span className="text-destructive text-xs sm:text-sm">Erro</span>
              ) : (
                formatCurrency(getMethodTotal('CARD'))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Pagamentos no cartão</span>
              <span className="sm:hidden">Cartão</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-xs sm:text-sm text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSummary}
            className="mt-2 w-full sm:w-auto"
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  )
}