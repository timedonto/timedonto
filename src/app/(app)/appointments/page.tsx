"use client"

import * as React from "react"
import { AppointmentStatus } from '@prisma/client'
import { AppointmentsClient } from './client'
import { AppointmentFormModal } from '@/components/appointments/appointment-form-modal'
import { Appointment } from './columns'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [dentists, setDentists] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Filters
  const [selectedDate, setSelectedDate] = React.useState<string>('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | undefined>(undefined)

  const fetchDentists = async () => {
    try {
      const response = await fetch('/api/dentists')
      const data = await response.json()
      if (data.success && data.data) {
        setDentists(data.data.map((d: any) => ({
          id: d.id,
          name: d.user.name
        })))
      }
    } catch (err) {
      console.error('Erro ao buscar dentistas:', err)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedDate) {
        params.append('date', selectedDate)
      }

      const response = await fetch(`/api/appointments?${params.toString()}`)
      const data: ApiResponse<any[]> = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar agendamentos')
      }

      if (data.success && data.data) {
        // Convert dates to Date objects
        const formatted = data.data.map(app => ({
          ...app,
          date: new Date(app.date),
          createdAt: new Date(app.createdAt),
          updatedAt: new Date(app.updatedAt)
        }))
        setAppointments(formatted)
      }
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const isMounted = React.useRef(false)

  React.useEffect(() => {
    fetchDentists()
    fetchAppointments()
    isMounted.current = true
  }, [])

  React.useEffect(() => {
    if (isMounted.current) {
      fetchAppointments()
    }
  }, [selectedDate])

  const handleCreateAppointment = () => {
    setSelectedAppointment(undefined)
    setIsModalOpen(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchAppointments()
  }

  const handleDateChange = React.useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  return (
    <>
      <AppointmentsClient
        initialData={appointments}
        dentists={dentists}
        loading={loading}
        onEdit={handleEditAppointment}
        onCreate={handleCreateAppointment}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />

      <AppointmentFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        appointment={selectedAppointment as any}
        onSuccess={handleModalSuccess}
      />
    </>
  )
}