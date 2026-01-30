"use client"

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle, XCircle, User, Calendar, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  data?: TreatmentPlanApiData
  error?: string
}

interface TreatmentPlanDetailsPageProps {
  params: Promise<{ id: string }>
}

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

export default function TreatmentPlanDetailsPage({ params }: TreatmentPlanDetailsPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlanApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Buscar dados do orçamento
  const fetchTreatmentPlan = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/treatment-plans/${id}`)
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError('Orçamento não encontrado')
        } else {
          throw new Error(data.error || 'Erro ao carregar orçamento')
        }
        return
      }

      if (data.success && data.data) {
        setTreatmentPlan(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar orçamento:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamento')
    } finally {
      setLoading(false)
    }
  }, [id])

  // Carregar orçamento ao montar o componente
  useEffect(() => {
    fetchTreatmentPlan()
  }, [fetchTreatmentPlan])

  // Atualizar status do orçamento
  const updateStatus = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!treatmentPlan) return

    try {
      setUpdating(true)
      setError(null)

      const response = await fetch(`/api/treatment-plans/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar orçamento')
      }

      // Atualizar dados localmente
      if (data.data) {
        setTreatmentPlan(data.data)
      } else {
        // Fallback: recarregar dados
        await fetchTreatmentPlan()
      }

    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar orçamento')
    } finally {
      setUpdating(false)
    }
  }

  // Handlers
  const handleBack = () => {
    router.push('/treatment-plans')
  }

  const handleApprove = () => {
    updateStatus('APPROVED')
  }

  const handleReject = () => {
    updateStatus('REJECTED')
  }

  const handlePatientClick = () => {
    if (treatmentPlan?.patient?.id) {
      router.push(`/patients/${treatmentPlan.patient.id}`)
    }
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false)
    fetchTreatmentPlan()
  }

  // Formatadores
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  }

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

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm sm:text-base">Carregando dados do orçamento...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 px-4">
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold">Erro ao carregar orçamento</h3>
          <p className="text-sm sm:text-base text-muted-foreground">{error}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleBack} variant="outline" size="sm" className="w-full sm:w-auto">
            Voltar para lista
          </Button>
          <Button onClick={fetchTreatmentPlan} size="sm" className="w-full sm:w-auto">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!treatmentPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 px-4">
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold">Orçamento não encontrado</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            O orçamento que você está procurando não existe ou foi removido
          </p>
        </div>
        <Button onClick={handleBack} variant="outline" size="sm" className="w-full sm:w-auto">
          Voltar para lista
        </Button>
      </div>
    )
  }

  const canUpdateStatus = treatmentPlan.status === 'OPEN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para lista</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          <div className="hidden sm:block h-6 w-px bg-border" />
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Orçamento #{treatmentPlan.id.slice(-8)}
            </h1>
            <Badge variant={statusVariants[treatmentPlan.status]} className="self-start sm:self-auto">
              {statusLabels[treatmentPlan.status]}
            </Badge>
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:gap-2">
          {canUpdateStatus && (
            <>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                disabled={updating}
                size="sm"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button
                onClick={handleReject}
                variant="outline"
                disabled={updating}
                size="sm"
                className="flex items-center gap-2 text-destructive hover:text-destructive w-full sm:w-auto"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Rejeitar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={updating}
                size="sm"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Aprovar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Erro de atualização */}
      {error && !loading && (
        <div className="rounded-md bg-destructive/10 p-3 mx-4 sm:mx-0">
          <p className="text-xs sm:text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Cards com informações */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Paciente</p>
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-primary hover:underline text-sm sm:text-base"
                onClick={handlePatientClick}
              >
                {treatmentPlan.patient?.name || 'N/A'}
              </Button>
              {treatmentPlan.patient?.email && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {treatmentPlan.patient.email}
                </p>
              )}
            </div>
            
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Dentista</p>
              <p className="text-sm sm:text-base font-medium">
                {treatmentPlan.dentist?.user.name || 'N/A'}
              </p>
              {treatmentPlan.dentist?.cro && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  CRO: {treatmentPlan.dentist.cro}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Data de Criação</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <p className="text-xs sm:text-sm">{formatDate(treatmentPlan.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {formatCurrency(treatmentPlan.totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {treatmentPlan.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm whitespace-pre-wrap">{treatmentPlan.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Itens do Orçamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Itens do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Layout Mobile - Cards */}
          <div className="md:hidden space-y-4">
            {treatmentPlan.items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="font-medium text-sm">{item.description}</div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Dente:</span>
                    <div className="font-medium">{item.tooth || '-'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Qtd:</span>
                    <div className="font-medium">{item.quantity}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Valor Unit.:</span>
                    <div className="font-medium">{formatCurrency(item.value)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Subtotal:</span>
                    <div className="font-medium text-primary">{formatCurrency(item.value * item.quantity)}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total Mobile */}
            <div className="border-t-2 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">Total Geral:</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(treatmentPlan.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Layout Desktop/Tablet - Tabela */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs lg:text-sm">Descrição</TableHead>
                  <TableHead className="text-xs lg:text-sm">Dente</TableHead>
                  <TableHead className="text-xs lg:text-sm text-right">Valor Unit.</TableHead>
                  <TableHead className="text-xs lg:text-sm text-center">Qtd</TableHead>
                  <TableHead className="text-xs lg:text-sm text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatmentPlan.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs lg:text-sm">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs lg:text-sm">
                      {item.tooth || '-'}
                    </TableCell>
                    <TableCell className="text-right text-xs lg:text-sm">
                      {formatCurrency(item.value)}
                    </TableCell>
                    <TableCell className="text-center text-xs lg:text-sm">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs lg:text-sm">
                      {formatCurrency(item.value * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Linha de total */}
                <TableRow className="border-t-2">
                  <TableCell colSpan={4} className="font-bold text-right text-xs lg:text-sm">
                    Total Geral:
                  </TableCell>
                  <TableCell className="text-right font-bold text-sm lg:text-lg text-primary">
                    {formatCurrency(treatmentPlan.totalAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de edição */}
      {treatmentPlan && (
        <TreatmentPlanFormModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSuccess={handleEditSuccess}
          treatmentPlan={treatmentPlan}
        />
      )}
    </div>
  )
}