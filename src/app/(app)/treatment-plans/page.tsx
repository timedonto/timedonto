"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Loader2, Search, Filter, Pencil } from 'lucide-react'
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
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TreatmentPlanFormModal } from '@/components/treatment-plans/treatment-plan-form-modal'

// Tipos para os dados da API
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
    procedureId: string | null
    description: string
    tooth: string | null
    value: number
    quantity: number
  }[]
  patient?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  dentist?: {
    id: string
    cro: string
    specialty: string | null
    user: {
      id: string
      name: string
      email: string
    }
  }
}

interface ApiResponse {
  success: boolean
  data?: TreatmentPlanApiData[]
  error?: string
}

type StatusFilter = 'all' | 'OPEN' | 'APPROVED' | 'REJECTED'

const statusLabels = {
  OPEN: 'Aberto',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado'
}

const statusVariants = {
  OPEN: 'default' as const,
  APPROVED: 'success' as const,
  REJECTED: 'destructive' as const
}

export default function TreatmentPlansPage() {
  const router = useRouter()
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlanApiData[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTreatmentPlan, setSelectedTreatmentPlan] = useState<TreatmentPlanApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Filtrar orçamentos baseado nos filtros
  const filteredTreatmentPlans = useMemo(() => {
    let filtered = treatmentPlans

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan => plan.status === statusFilter)
    }

    // Filtro por busca de paciente
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(plan => 
        plan.patient?.name.toLowerCase().includes(term) ||
        plan.patient?.email?.toLowerCase().includes(term) ||
        plan.patient?.phone?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [treatmentPlans, statusFilter, searchTerm])

  // Carregar orçamentos
  const fetchTreatmentPlans = async () => {
    try {
      setLoading(true)
      setError(null)

      // Construir URL com filtros
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const url = `/api/treatment-plans${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar orçamentos')
      }

      if (data.success && data.data) {
        setTreatmentPlans(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
    }
  }

  // Carregar orçamentos ao montar o componente e quando filtros mudarem
  useEffect(() => {
    fetchTreatmentPlans()
  }, [statusFilter])

  const handleViewTreatmentPlan = (treatmentPlanId: string) => {
    router.push(`/treatment-plans/${treatmentPlanId}`)
  }

  const handleEditTreatmentPlan = (e: React.MouseEvent, plan: TreatmentPlanApiData) => {
    e.stopPropagation()
    setSelectedTreatmentPlan(plan)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    setSelectedTreatmentPlan(null)
    fetchTreatmentPlans()
  }

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  }

  // Formatar data (usando formatação manual já que date-fns não está instalado)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie os orçamentos da clínica
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Orçamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm font-medium">Filtros:</span>
          </div>
          
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 flex-1">
            {/* Filtro de status */}
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="OPEN">Aberto</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="REJECTED">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo de busca por paciente */}
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>
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
              <span className="text-sm sm:text-base">Carregando orçamentos...</span>
            </div>
          </div>
        ) : error ? (
          // Estado de erro
          <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold">Erro ao carregar orçamentos</h3>
              <p className="text-sm sm:text-base text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchTreatmentPlans} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        ) : filteredTreatmentPlans.length === 0 ? (
          // Estado vazio
          <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold">
                {searchTerm.trim() || statusFilter !== 'all' 
                  ? 'Nenhum orçamento encontrado' 
                  : 'Nenhum orçamento cadastrado'
                }
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {searchTerm.trim() || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros da busca'
                  : 'Comece criando o primeiro orçamento da clínica'
                }
              </p>
            </div>
            {!searchTerm.trim() && statusFilter === 'all' && (
              <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2" size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Criar Primeiro Orçamento</span>
                <span className="sm:hidden">Criar Orçamento</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Layout Mobile - Cards */}
            <div className="md:hidden space-y-4 p-4">
              {filteredTreatmentPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewTreatmentPlan(plan.id)}
                >
                  {/* Paciente e Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{plan.patient?.name || 'N/A'}</div>
                      {plan.patient?.email && (
                        <div className="text-xs text-muted-foreground">{plan.patient.email}</div>
                      )}
                    </div>
                    <Badge variant={statusVariants[plan.status]} className="text-xs ml-2">
                      {statusLabels[plan.status]}
                    </Badge>
                  </div>

                  {/* Dentista */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Dentista</div>
                    <div className="text-sm">{plan.dentist?.user.name || 'N/A'}</div>
                    {plan.dentist?.cro && (
                      <div className="text-xs text-muted-foreground">CRO: {plan.dentist.cro}</div>
                    )}
                  </div>

                  {/* Valor e Data */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Valor Total</div>
                      <div className="text-sm font-medium">{formatCurrency(plan.totalAmount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Data</div>
                      <div className="text-xs">{formatDate(plan.createdAt)}</div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    {plan.status === 'OPEN' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleEditTreatmentPlan(e, plan)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Editar orçamento</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewTreatmentPlan(plan.id)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-3 w-3" />
                      <span className="sr-only">Ver orçamento</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Layout Desktop/Tablet - Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs lg:text-sm">Paciente</TableHead>
                    <TableHead className="text-xs lg:text-sm hidden lg:table-cell">Dentista</TableHead>
                    <TableHead className="text-xs lg:text-sm">Valor Total</TableHead>
                    <TableHead className="text-xs lg:text-sm">Status</TableHead>
                    <TableHead className="text-xs lg:text-sm hidden lg:table-cell">Data</TableHead>
                    <TableHead className="text-xs lg:text-sm text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTreatmentPlans.map((plan) => (
                    <TableRow 
                      key={plan.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewTreatmentPlan(plan.id)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium text-xs lg:text-sm">{plan.patient?.name || 'N/A'}</div>
                          {plan.patient?.email && (
                            <div className="text-xs text-muted-foreground">
                              {plan.patient.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div>
                          <div className="font-medium text-xs lg:text-sm">{plan.dentist?.user.name || 'N/A'}</div>
                          {plan.dentist?.cro && (
                            <div className="text-xs text-muted-foreground">
                              CRO: {plan.dentist.cro}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs lg:text-sm">
                        {formatCurrency(plan.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[plan.status]} className="text-xs">
                          {statusLabels[plan.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs lg:text-sm hidden lg:table-cell">
                        {formatDate(plan.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {plan.status === 'OPEN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleEditTreatmentPlan(e, plan)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar orçamento</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewTreatmentPlan(plan.id)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver orçamento</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Resumo dos resultados */}
      {!loading && !error && (
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 text-xs sm:text-sm text-muted-foreground px-4 sm:px-0">
          <div>
            {filteredTreatmentPlans.length === 1 
              ? '1 orçamento encontrado'
              : `${filteredTreatmentPlans.length} orçamentos encontrados`
            }
          </div>
          {filteredTreatmentPlans.length > 0 && (
            <div className="font-medium">
              Total: {formatCurrency(
                filteredTreatmentPlans.reduce((sum, plan) => sum + plan.totalAmount, 0)
              )}
            </div>
          )}
        </div>
      )}

      <TreatmentPlanFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setSelectedTreatmentPlan(null)
          }
        }}
        onSuccess={handleModalSuccess}
        treatmentPlan={selectedTreatmentPlan || undefined}
      />
    </div>
  )
}