"use client"

import * as React from "react"
import Image from "next/image"
import { Plus, MoreVertical, Loader2, Info } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSession } from "next-auth/react"
import { UserRole } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ToothFacesSelector } from "@/components/attendances/tooth-faces-selector"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Trash2 } from "lucide-react"

interface Treatment {
  id: string
  procedureId: string | null
  procedureCode: string | null
  description: string
  tooth: string | null
  faces: string[]
  quantity: number
  clinicalStatus: string | null
  price: number | null
  dentistId: string | null
  observations: string | null
  createdAt: Date
  procedure?: {
    id: string
    name: string
    baseValue: number
    description: string | null
  } | null
  dentist?: {
    id: string
    cro: string
    user: {
      id: string
      name: string
    }
  } | null
}

interface Procedure {
  id: string
  name: string
  description: string | null
  baseValue: number
}

interface AttendanceTreatmentTabProps {
  attendanceId: string
  initialTreatments: Treatment[]
  dentistId: string | null
  readOnly?: boolean
}

const CLINICAL_STATUS_OPTIONS = [
  { value: 'SAUDAVEL', label: 'Saudável' },
  { value: 'CARIE', label: 'Cárie' },
  { value: 'RESTAURADO', label: 'Restaurado' },
  { value: 'AUSENTE', label: 'Ausente' },
  { value: 'EM_TRATAMENTO', label: 'Em Tratamento' },
  { value: 'EXTRACAO', label: 'Extração' }
]

const TOOTH_OPTIONS = [
  // Superior direito
  ...Array.from({ length: 8 }, (_, i) => 18 - i).map(n => n.toString()),
  // Superior esquerdo
  ...Array.from({ length: 8 }, (_, i) => 21 + i).map(n => n.toString()),
  // Inferior esquerdo
  ...Array.from({ length: 8 }, (_, i) => 48 - i).map(n => n.toString()),
  // Inferior direito
  ...Array.from({ length: 8 }, (_, i) => 31 + i).map(n => n.toString()),
]

const FACE_LABELS: Record<string, string> = {
  O: 'Oclusal',
  M: 'Mesial',
  D: 'Distal',
  V: 'Vestibular',
  L: 'Lingual'
}

export function AttendanceTreatmentTab({
  attendanceId,
  initialTreatments,
  dentistId: attendanceDentistId,
  readOnly = false
}: AttendanceTreatmentTabProps) {
  const { data: session } = useSession()
  const [treatments, setTreatments] = React.useState<Treatment[]>(initialTreatments)
  const [loading, setLoading] = React.useState(false)
  const [procedures, setProcedures] = React.useState<Procedure[]>([])
  const [loadingProcedures, setLoadingProcedures] = React.useState(false)
  const [dentistName, setDentistName] = React.useState<string>("Carregando...")

  // Form state
  const [selectedFaces, setSelectedFaces] = React.useState<string[]>([])
  const [selectedProcedureId, setSelectedProcedureId] = React.useState<string>("")
  const [selectedTooth, setSelectedTooth] = React.useState<string>("")
  const [clinicalStatus, setClinicalStatus] = React.useState<string>("")
  const [observations, setObservations] = React.useState<string>("")
  const [price, setPrice] = React.useState<number | null>(null)

  const userRole = session?.user?.role as UserRole
  const canModify = !readOnly && (userRole === UserRole.OWNER || userRole === UserRole.ADMIN || userRole === UserRole.DENTIST)

  // Carregar procedimentos do dentista e info do dentista
  React.useEffect(() => {
    const fetchDentistAndProcedures = async () => {
      try {
        setLoadingProcedures(true)

        // 1. Determinar o ID do dentista (do atendimento ou do usuário logado)
        let idToUse = attendanceDentistId
        let nameToUse = "Nenhum dentista vinculado"

        if (userRole === UserRole.DENTIST) {
          // Buscar o registro de dentista do usuário logado
          const res = await fetch('/api/dentists')
          const data = await res.json()
          if (data.success && data.data) {
            const me = data.data.find((d: any) => d.userId === session?.user?.id)
            if (me) {
              idToUse = me.id
              nameToUse = me.user.name
            }
          }
        } else if (attendanceDentistId) {
          // Buscar info do dentista do atendimento
          const res = await fetch(`/api/dentists/${attendanceDentistId}`)
          const data = await res.json()
          if (data.success && data.data) {
            nameToUse = data.data.user.name
          }
        }

        setDentistName(nameToUse)

        if (idToUse) {
          const response = await fetch(`/api/dentists/${idToUse}/procedures`)
          const data = await response.json()
          if (data.success && data.data) {
            setProcedures(data.data)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do dentista:', err)
        setDentistName("Erro ao carregar")
      } finally {
        setLoadingProcedures(false)
      }
    }

    if (session) {
      fetchDentistAndProcedures()
    }
  }, [attendanceDentistId, session, userRole])

  // Atualizar preço quando procedimento for selecionado
  React.useEffect(() => {
    if (selectedProcedureId) {
      const procedure = procedures.find(p => p.id === selectedProcedureId)
      if (procedure) {
        setPrice(procedure.baseValue)
      }
    } else {
      setPrice(null)
    }
  }, [selectedProcedureId, procedures])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação detalhada com mensagens específicas
    const errors: string[] = []
    
    if (!selectedProcedureId || selectedProcedureId.trim() === '') {
      errors.push('Procedimento')
    }
    
    if (!selectedTooth || selectedTooth.trim() === '') {
      errors.push('Dente')
    }
    
    if (!selectedFaces || selectedFaces.length === 0) {
      errors.push('Faces')
    }
    
    if (!clinicalStatus || clinicalStatus.trim() === '') {
      errors.push('Status Clínico')
    }

    if (errors.length > 0) {
      alert(`Preencha todos os campos obrigatórios: ${errors.join(', ')}`)
      return
    }

    // Validar formato do dente (deve estar entre 11-18, 21-28, 31-38, 41-48)
    const toothRegex = /^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$/
    if (!toothRegex.test(selectedTooth)) {
      alert('Dente inválido. Deve estar entre 11-18, 21-28, 31-38 ou 41-48')
      return
    }

    // Validar faces (devem ser O, M, D, V ou L)
    const validFaces = ['O', 'M', 'D', 'V', 'L']
    const invalidFaces = selectedFaces.filter(face => !validFaces.includes(face))
    if (invalidFaces.length > 0) {
      alert(`Faces inválidas: ${invalidFaces.join(', ')}. Use apenas: O, M, D, V, L`)
      return
    }

    try {
      setLoading(true)
      
      const requestBody = {
        procedureId: selectedProcedureId.trim(),
        tooth: selectedTooth.trim(),
        faces: selectedFaces,
        clinicalStatus: clinicalStatus.trim(),
        observations: observations.trim() || undefined,
      }

      console.log('Enviando dados:', requestBody)

      const response = await fetch(`/api/attendances/${attendanceId}/procedures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        console.error('Erro na resposta:', data)
        const errorMessage = data.error || `Erro ao adicionar tratamento (${response.status})`
        alert(errorMessage)
        return
      }

      // Recarregar tratamentos
      const treatmentsResponse = await fetch(`/api/attendances/${attendanceId}/procedures`)
      const treatmentsData = await treatmentsResponse.json()
      if (treatmentsData.success) {
        setTreatments(treatmentsData.data)
      }

      // Reset form
      setSelectedFaces([])
      setSelectedProcedureId("")
      setSelectedTooth("")
      setClinicalStatus("")
      setObservations("")
      setPrice(null)
    } catch (err) {
      console.error('Erro ao adicionar tratamento:', err)
      alert('Erro ao adicionar tratamento. Verifique o console para mais detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (procedureId: string) => {
    if (!confirm('Tem certeza que deseja remover este registro de tratamento?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/attendances/${attendanceId}/procedures?procedureId=${procedureId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        // Recarregar tratamentos
        const treatmentsResponse = await fetch(`/api/attendances/${attendanceId}/procedures`)
        const treatmentsData = await treatmentsResponse.json()
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data)
        }
      } else {
        alert(data.error || 'Erro ao remover tratamento')
      }
    } catch (err) {
      console.error('Erro ao remover tratamento:', err)
      alert('Erro ao remover tratamento')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null

    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'success' | 'outline' | 'destructive' | 'warning', label: string }> = {
      SAUDAVEL: { variant: 'success', label: 'Saudável' },
      CARIE: { variant: 'destructive', label: 'Cárie' },
      RESTAURADO: { variant: 'secondary', label: 'Restaurado' },
      AUSENTE: { variant: 'outline', label: 'Ausente' },
      EM_TRATAMENTO: { variant: 'warning', label: 'Em Tratamento' },
      EXTRACAO: { variant: 'destructive', label: 'Extração' }
    }

    const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={statusInfo.variant} className="font-medium">{statusInfo.label}</Badge>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. MAPA DE DENTES (REFERÊNCIA) */}
      <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Mapa de Dentes - Referência</CardTitle>
              <CardDescription>
                Consulte a numeração universal (FDI) para selecionar o dente corretamente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 md:p-8 flex flex-col items-center">
            <div className="relative w-full max-w-4xl aspect-[2/1] bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-inner-lg flex items-center justify-center group">
              <Image
                src="/mapadentes2.png"
                alt="Mapa de Dentes - Numeração FDI"
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                priority
              />
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Superior</p>
                <p className="text-xs text-blue-700/70 dark:text-blue-400/70">Quadrantes 1 (Direito: 18-11) e 2 (Esquerdo: 21-28)</p>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">Inferior</p>
                <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70">Quadrantes 4 (Direito: 48-41) e 3 (Esquerdo: 31-38)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 2. FORMULÁRIO DE REGISTRO */}
        <div className="lg:col-span-5">
          <Card className={cn("sticky top-24 border-none shadow-premium transition-all", !canModify && "opacity-80 grayscale-[0.2]")}>
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Novo Registro Clínico
              </CardTitle>
              <CardDescription>
                Adicione um novo tratamento ao prontuário do paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {canModify ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Faces do Dente */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20">
                    <ToothFacesSelector
                      selectedFaces={selectedFaces}
                      onChange={setSelectedFaces}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Procedimento */}
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold">Procedimento *</Label>
                      <Select
                        value={selectedProcedureId || undefined}
                        onValueChange={(value) => {
                          if (value && value.trim() !== '') {
                            setSelectedProcedureId(value)
                          } else {
                            setSelectedProcedureId("")
                          }
                        }}
                        disabled={loadingProcedures || loading}
                      >
                        <SelectTrigger className="h-11 bg-background shadow-sm">
                          <SelectValue placeholder={loadingProcedures ? "Carregando serviços..." : "Selecione o procedimento"} />
                        </SelectTrigger>
                        <SelectContent>
                          {procedures.map((proc) => (
                            <SelectItem key={proc.id} value={proc.id} className="py-3">
                              <span className="font-medium">{proc.name}</span>
                            </SelectItem>
                          ))}
                          {procedures.length === 0 && !loadingProcedures && (
                            <div className="text-xs text-center p-4 text-muted-foreground">
                              Nenhum procedimento encontrado para este dentista.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preço */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Preço</Label>
                      <div className="relative">
                        <Input
                          value={price !== null ? `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---'}
                          readOnly
                          className="h-11 bg-muted/50 font-bold text-primary border-primary/20"
                        />
                      </div>
                    </div>

                    {/* Dente */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Dente *</Label>
                      <Select
                        value={selectedTooth || undefined}
                        onValueChange={(value) => {
                          if (value && value.trim() !== '') {
                            setSelectedTooth(value)
                          } else {
                            setSelectedTooth("")
                          }
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-11 bg-background shadow-sm">
                          <SelectValue placeholder="Selecione o dente" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {TOOTH_OPTIONS.map((tooth) => (
                            <SelectItem key={tooth} value={tooth}>
                              Dente {tooth}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Clínico */}
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold">Tipo (Status Clínico) *</Label>
                      <Select
                        value={clinicalStatus || undefined}
                        onValueChange={(value) => {
                          if (value && value.trim() !== '') {
                            setClinicalStatus(value)
                          } else {
                            setClinicalStatus("")
                          }
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-11 bg-background shadow-sm">
                          <SelectValue placeholder="Selecione o estado clínico" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLINICAL_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Observações Clínicas</Label>
                    <Textarea
                      placeholder="Detalhes adicionais sobre o estado do dente ou técnica utilizada..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="min-h-[100px] resize-none bg-background shadow-sm focus:ring-primary/20"
                      disabled={loading}
                    />
                  </div>

                  {/* Dentista (readonly) */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary uppercase">Dentista Responsável</span>
                    <span className="text-sm font-medium">{dentistName}</span>
                  </div>

                  {/* Botão Submit */}
                  <Button
                    type="submit"
                    disabled={loading || loadingProcedures}
                    className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Registrando...</>
                    ) : (
                      <><Plus className="mr-2 h-5 w-5" /> Adicionar ao Prontuário</>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Info className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {readOnly ? "Atendimento Finalizado" : "Acesso Restrito"}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {readOnly
                        ? "Este atendimento já foi concluído ou cancelado. O registro de novos tratamentos está desabilitado."
                        : "Apenas dentistas e administradores podem registrar novos tratamentos no prontuário."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3. TABELA DE HISTÓRICO */}
        <div className="lg:col-span-7">
          <Card className="border-none shadow-premium min-h-full">
            <CardHeader className="bg-slate-900 dark:bg-slate-800 text-white rounded-t-xl pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Histórico deste Atendimento</CardTitle>
                  <CardDescription className="text-slate-300">
                    Todos os registros clínicos realizados hoje para este paciente
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-white/20 text-white font-bold bg-white/10 uppercase tracking-tighter">
                  {treatments.length} Registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {treatments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground italic space-y-3">
                  <div className="p-4 rounded-full bg-muted/50">
                    <Info className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <p>Nenhum tratamento registrado para este atendimento.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px] font-bold">Data/Hora</TableHead>
                        <TableHead className="w-[80px] text-center font-bold">Dente</TableHead>
                        <TableHead className="font-bold">Faces</TableHead>
                        <TableHead className="font-bold">Procedimento</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="text-right font-bold w-[60px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...treatments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((treatment) => (
                        <TableRow key={treatment.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <TableCell className="text-xs font-semibold whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{format(new Date(treatment.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                              <span className="text-muted-foreground font-normal">{format(new Date(treatment.createdAt), "HH:mm")}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-black text-sm border-2 border-primary/20 shadow-sm">
                              {treatment.tooth || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {treatment.faces && treatment.faces.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {treatment.faces.map((face) => (
                                  <span
                                    key={face}
                                    title={FACE_LABELS[face]}
                                    className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black border border-slate-300 dark:border-slate-700 shadow-sm"
                                  >
                                    {face}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">Nenhuma</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col max-w-[200px]">
                              <span className="font-bold text-sm truncate">{treatment.procedure?.name || treatment.description}</span>
                              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                                {treatment.procedureCode || treatment.procedureId?.substring(0, 8) || 'COD-INV'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(treatment.clinicalStatus)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full opacity-40 group-hover:opacity-100 transition-opacity" disabled={!canModify}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                                  onClick={() => handleDelete(treatment.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Excluir</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
