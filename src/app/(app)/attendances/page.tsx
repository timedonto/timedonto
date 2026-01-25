"use client"

import * as React from "react"
import { AttendanceClient } from './client'
import { Attendance } from './columns'
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export default function AttendancesPage() {
  const router = useRouter()
  const [attendances, setAttendances] = React.useState<Attendance[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Filters
  const [selectedDate, setSelectedDate] = React.useState<string>(
    new Date().toISOString().split('T')[0]
  )

  const fetchAttendances = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedDate) {
        params.append('date', selectedDate)
      }

      const response = await fetch(`/api/attendances?${params.toString()}`, {
        cache: 'no-store'
      })
      const data: ApiResponse<any[]> = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar atendimentos')
      }

      if (data.success && data.data) {
        // Convert dates
        const formatted = data.data.map(att => ({
          ...att,
          arrivalAt: new Date(att.arrivalAt),
          startedAt: att.startedAt ? new Date(att.startedAt) : null,
          finishedAt: att.finishedAt ? new Date(att.finishedAt) : null,
          createdAt: new Date(att.createdAt),
          updatedAt: new Date(att.updatedAt)
        }))
        setAttendances(formatted)
      }
    } catch (err) {
      console.error('Erro ao buscar atendimentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar atendimentos')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchAttendances()
  }, [selectedDate])

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Atendimentos</h2>
          <p className="text-muted-foreground">
            Gerencie os atendimentos do dia e a fila de espera.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/attendances/waiting-room')} variant="outline">
            Fila de Espera
          </Button>
          <Button onClick={() => router.push('/appointments')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {error}
        </div>
      ) : (
        <AttendanceClient 
          initialData={attendances} 
          loading={loading}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onRefresh={fetchAttendances}
        />
      )}
    </div>
  )
}
