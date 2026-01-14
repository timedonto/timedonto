"use client"

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle, XCircle, User, Calendar } from 'lucide-react'
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando dados do orçamento...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erro ao carregar orçamento</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBack} variant="outline">
            Voltar para lista
          </Button>
          <Button onClick={fetchTreatmentPlan}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!treatmentPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Orçamento não encontrado</h3>
          <p className="text-muted-foreground">
            O orçamento que você está procurando não existe ou foi removido
          </p>
        </div>
        <Button onClick={handleBack} variant="outline">
          Voltar para lista
        </Button>
      </div>
    )
  }

  const canUpdateStatus = treatmentPlan.status === 'OPEN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para lista
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Orçamento #{treatmentPlan.id.slice(-8)}
            </h1>
            <Badge variant={statusVariants[treatmentPlan.status]}>
              {statusLabels[treatmentPlan.status]}
            </Badge>
          </div>
        </div>
        
        {/* Botões de ação */}
        {canUpdateStatus && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReject}
              variant="outline"
              disabled={updating}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
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
              className="flex items-center gap-2"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Aprovar
            </Button>
          </div>
        )}
      </div>

      {/* Erro de atualização */}
      {error && !loading && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Cards com informações */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paciente</p>
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-primary hover:underline"
                onClick={handlePatientClick}
              >
                {treatmentPlan.patient?.name || 'N/A'}
              </Button>
              {treatmentPlan.patient?.email && (
                <p className="text-sm text-muted-foreground">
                  {treatmentPlan.patient.email}
                </p>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dentista</p>
              <p className="text-sm font-medium">
                {treatmentPlan.dentist?.user.name || 'N/A'}
              </p>
              {treatmentPlan.dentist?.cro && (
                <p className="text-sm text-muted-foreground">
                  CRO: {treatmentPlan.dentist.cro}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(treatmentPlan.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(treatmentPlan.totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {treatmentPlan.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{treatmentPlan.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Itens do Orçamento */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Dente</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatmentPlan.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.tooth || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.value)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.value * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Linha de total */}
                <TableRow className="border-t-2">
                  <TableCell colSpan={4} className="font-bold text-right">
                    Total Geral:
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">
                    {formatCurrency(treatmentPlan.totalAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}