"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Clock, CheckCircle2, User, Stethoscope, Activity } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Attendance } from "../columns"

// Import components
import { AttendanceCIDTab } from "./components/attendance-cid-tab"
import { AttendanceTreatmentTab } from "./components/attendance-treatment-tab"
import { AttendanceDocumentsTab } from "./components/attendance-documents-tab"

const statusLabels: Record<string, string> = {
    CHECKED_IN: 'Check-in',
    IN_PROGRESS: 'Em Atendimento',
    DONE: 'Finalizado',
    CANCELED: 'Cancelado',
    NO_SHOW: 'Não Compareceu'
}

const statusVariants: Record<string, 'default' | 'secondary' | 'success' | 'outline' | 'destructive' | 'warning'> = {
    CHECKED_IN: 'secondary',
    IN_PROGRESS: 'warning',
    DONE: 'success',
    CANCELED: 'destructive',
    NO_SHOW: 'outline'
}

export default function AttendanceDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [attendance, setAttendance] = React.useState<Attendance | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [activeTab, setActiveTab] = React.useState("overview")

    const fetchAttendance = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/attendances/${params.id}`)
            
            // Verificar se a resposta é JSON antes de fazer parse
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text()
                console.error('Resposta não é JSON:', text.substring(0, 100))
                return
            }
            
            const data = await response.json()
            if (data.success && data.data) {
                setAttendance({
                    ...data.data,
                    arrivalAt: new Date(data.data.arrivalAt),
                    startedAt: data.data.startedAt ? new Date(data.data.startedAt) : null,
                    finishedAt: data.data.finishedAt ? new Date(data.data.finishedAt) : null,
                })
            }
        } catch (err) {
            console.error('Erro ao buscar atendimento:', err)
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchAttendance()
    }, [params.id])

    const handleStart = async () => {
        try {
            const response = await fetch(`/api/attendances/${params.id}/start`, {
                method: 'POST'
            })
            
            // Verificar se a resposta é JSON antes de fazer parse
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json()
                if (response.ok && data.success) {
                    await fetchAttendance()
                } else {
                    alert(data.error || 'Erro ao iniciar atendimento')
                }
            } else {
                const text = await response.text()
                console.error('Resposta não é JSON:', text.substring(0, 100))
                if (response.ok) {
                    await fetchAttendance()
                } else {
                    alert('Erro ao iniciar atendimento')
                }
            }
        } catch (err) {
            console.error('Erro ao iniciar atendimento:', err)
            alert('Erro ao iniciar atendimento. Tente novamente.')
        }
    }

    const handleFinish = async () => {
        try {
            const response = await fetch(`/api/attendances/${params.id}/finish`, {
                method: 'POST'
            })
            
            // Verificar se a resposta é JSON antes de fazer parse
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json()
                if (response.ok && data.success) {
                    await fetchAttendance()
                } else {
                    alert(data.error || 'Erro ao finalizar atendimento')
                }
            } else {
                const text = await response.text()
                console.error('Resposta não é JSON:', text.substring(0, 100))
                if (response.ok) {
                    await fetchAttendance()
                } else {
                    alert('Erro ao finalizar atendimento')
                }
            }
        } catch (err) {
            console.error('Erro ao finalizar atendimento:', err)
            alert('Erro ao finalizar atendimento. Tente novamente.')
        }
    }

    if (loading) {
        return <div className="p-8">Carregando...</div>
    }

    if (!attendance) {
        return <div className="p-8 text-center flex flex-col items-center gap-4">
            <p>Atendimento não encontrado</p>
            <Button onClick={() => router.push('/attendances')}>Voltar para lista</Button>
        </div>
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push('/attendances')} size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Atendimento: {attendance.patient.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={statusVariants[attendance.status]}>
                                {statusLabels[attendance.status]}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                Chegada em {format(attendance.arrivalAt, "HH:mm", { locale: ptBR })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {attendance.status === 'CHECKED_IN' && (
                        <Button onClick={handleStart}>
                            Iniciar Atendimento
                        </Button>
                    )}
                    {attendance.status === 'IN_PROGRESS' && (
                        <Button onClick={handleFinish} variant="default">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Finalizar Atendimento
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paciente</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{attendance.patient.name}</div>
                        <p className="text-xs text-muted-foreground">{attendance.patient.phone || 'Sem telefone'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dentista</CardTitle>
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{attendance.dentist?.user.name || 'Não atribuído'}</div>
                        <p className="text-xs text-muted-foreground">{attendance.dentist?.cro || '-'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duração</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {attendance.startedAt ? (
                                attendance.finishedAt 
                                    ? `${Math.floor((attendance.finishedAt.getTime() - attendance.startedAt.getTime()) / 60000)} min`
                                    : `${Math.floor((new Date().getTime() - attendance.startedAt.getTime()) / 60000)} min...`
                            ) : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {attendance.startedAt ? `Início: ${format(attendance.startedAt, "HH:mm")}` : 'Aguardando início'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{statusLabels[attendance.status]}</div>
                        <p className="text-xs text-muted-foreground">Última atualização: {format(attendance.updatedAt, "HH:mm")}</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="cids">Diagnóstico (CID)</TabsTrigger>
                    <TabsTrigger value="treatment">Tratamento</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações do Atendimento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Criado por</h4>
                                    <p className="text-sm">{attendance.createdByRole === 'RECEPTIONIST' ? 'Recepção' : 'Dentista'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Agendamento</h4>
                                    <p className="text-sm">{attendance.appointment ? format(new Date(attendance.appointment.date), "dd/MM/yyyy HH:mm") : 'Encaixe'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cids" className="space-y-4">
                    <AttendanceCIDTab 
                        attendanceId={attendance.id} 
                        initialCIDs={attendance.cids} 
                        readOnly={attendance.status === 'DONE' || attendance.status === 'CANCELED'} 
                    />
                </TabsContent>

                <TabsContent value="treatment" className="space-y-4">
                    <AttendanceTreatmentTab 
                        attendanceId={attendance.id} 
                        initialTreatments={attendance.procedures as any} 
                        dentistId={attendance.dentistId}
                        readOnly={attendance.status === 'DONE' || attendance.status === 'CANCELED'} 
                    />
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <AttendanceDocumentsTab 
                        attendanceId={attendance.id} 
                        initialDocuments={attendance.documents} 
                        canGenerate={attendance.status === 'DONE'} 
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
