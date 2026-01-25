"use client"

import * as React from "react"
import { Attendance } from '../columns'
import { Clock, Play, User, Stethoscope, ArrowLeft, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

export default function WaitingRoomPage() {
  const router = useRouter()
  const [attendances, setAttendances] = React.useState<Attendance[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [startingAttendances, setStartingAttendances] = React.useState<Set<string>>(new Set())
  const [cancelingAttendances, setCancelingAttendances] = React.useState<Set<string>>(new Set())

  const fetchWaitingRoom = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/attendances/waiting-room', {
        cache: 'no-store'
      })
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Erro ao buscar fila de espera:', data)
        return
      }
      
      if (data.success && data.data) {
        setAttendances(data.data.map((att: any) => ({
          ...att,
          arrivalAt: new Date(att.arrivalAt)
        })))
      } else {
        console.error('Resposta inválida:', data)
        setAttendances([])
      }
    } catch (err) {
      console.error('Erro ao buscar fila de espera:', err)
      setAttendances([])
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (attendanceId: string) => {
    try {
      setStartingAttendances(prev => new Set(prev).add(attendanceId))
      setError(null)
      
      const response = await fetch(`/api/attendances/${attendanceId}/start`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        router.push(`/attendances/${attendanceId}`)
      } else {
        const errorMessage = data.error || 'Erro ao iniciar atendimento'
        setError(errorMessage)
        alert(errorMessage)
      }
    } catch (err) {
      const errorMessage = 'Erro ao iniciar atendimento. Tente novamente.'
      console.error('Erro ao iniciar atendimento:', err)
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setStartingAttendances(prev => {
        const next = new Set(prev)
        next.delete(attendanceId)
        return next
      })
    }
  }

  const handleCancel = async (attendanceId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este atendimento? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setCancelingAttendances(prev => new Set(prev).add(attendanceId))
      setError(null)
      
      const response = await fetch(`/api/attendances/${attendanceId}/cancel`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Recarregar a lista de atendimentos
        await fetchWaitingRoom()
      } else {
        const errorMessage = data.error || 'Erro ao cancelar atendimento'
        setError(errorMessage)
        alert(errorMessage)
      }
    } catch (err) {
      const errorMessage = 'Erro ao cancelar atendimento. Tente novamente.'
      console.error('Erro ao cancelar atendimento:', err)
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setCancelingAttendances(prev => {
        const next = new Set(prev)
        next.delete(attendanceId)
        return next
      })
    }
  }

  React.useEffect(() => {
    fetchWaitingRoom()
    // Refresh a cada 30 segundos
    const interval = setInterval(fetchWaitingRoom, 30000)
    return () => clearInterval(interval)
  }, [])

  // Recarregar quando a página receber foco
  React.useEffect(() => {
    const handleFocus = () => {
      fetchWaitingRoom()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Fila de Espera</h2>
            <p className="text-muted-foreground">
              Acompanhe os pacientes que aguardam atendimento.
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchWaitingRoom}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          <p className="font-medium">Erro</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted" />
              <CardContent className="h-24" />
            </Card>
          ))
        ) : attendances.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/10">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum paciente aguardando</h3>
            <p className="text-sm text-muted-foreground">
              Novos atendimentos aparecerão aqui após o check-in na recepção.
            </p>
          </div>
        ) : (
          attendances.map((attendance) => (
            <Card key={attendance.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {formatDistanceToNow(attendance.arrivalAt, { locale: ptBR, addSuffix: true })}
                  </Badge>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">{attendance.patient.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {attendance.patient.phone || "Sem telefone"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Stethoscope className="h-4 w-4" />
                  <span>
                    Dentista: {attendance.dentist?.user.name || "Aguardando..."}
                  </span>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleStart(attendance.id)}
                  disabled={startingAttendances.has(attendance.id) || cancelingAttendances.has(attendance.id)}
                >
                  <Play className={`mr-2 h-4 w-4 ${startingAttendances.has(attendance.id) ? 'animate-spin' : ''}`} />
                  {startingAttendances.has(attendance.id) ? 'Iniciando...' : 'Iniciar Atendimento'}
                </Button>
                <Button 
                  variant="destructive"
                  className="w-full" 
                  onClick={() => handleCancel(attendance.id)}
                  disabled={startingAttendances.has(attendance.id) || cancelingAttendances.has(attendance.id)}
                >
                  <X className={`mr-2 h-4 w-4 ${cancelingAttendances.has(attendance.id) ? 'animate-spin' : ''}`} />
                  {cancelingAttendances.has(attendance.id) ? 'Cancelando...' : 'Cancelar'}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
