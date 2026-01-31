'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppointmentStatus } from '@/types/appointments'
import { format, startOfDay, endOfDay, addDays, subDays, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Appointment {
    id: string
    date: string
    patient: {
        id: string
        name: string
    }
    procedureRelation?: {
        name: string
    } | null
    procedureSnapshot?: any
    status: AppointmentStatus
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
    CONFIRMED: {
        label: 'CONFIRMADO',
        color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
        dotColor: 'bg-green-500',
    },
    SCHEDULED: {
        label: 'AGENDADO',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
        dotColor: 'bg-blue-500',
    },
    NO_SHOW: {
        label: 'FALTA',
        color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        dotColor: 'bg-red-500',
    },
    CANCELED: {
        label: 'CANCELADO',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
        dotColor: 'bg-gray-500',
    },
    RESCHEDULED: {
        label: 'REAGENDADO',
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
        dotColor: 'bg-yellow-500',
    },
    DONE: {
        label: 'FINALIZADO',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
        dotColor: 'bg-purple-500',
    },
}

interface DentistScheduleTabProps {
    dentistId: string
}

export function DentistScheduleTab({ dentistId }: DentistScheduleTabProps) {
    const router = useRouter()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | null>(null)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalAppointments: 0,
        confirmedCount: 0,
        noShowCount: 0,
        averageDuration: 0
    })

    const selectedDateFormatted = format(currentDate, "d 'de' MMMM, yyyy", { locale: ptBR })

    useEffect(() => {
        fetchAppointments()
    }, [currentDate, statusFilter, dentistId])

    const fetchAppointments = async () => {
        setLoading(true)
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd')
            const params = new URLSearchParams({
                dentistId,
                date: dateStr
            })
            
            if (statusFilter) {
                params.append('status', statusFilter)
            }

            const response = await fetch(`/api/appointments?${params.toString()}`)
            const result = await response.json()

            if (result.success && result.data) {
                setAppointments(result.data)
                
                // Calcular estatísticas
                const total = result.data.length
                const confirmed = result.data.filter((apt: Appointment) => apt.status === 'CONFIRMED').length
                const noShow = result.data.filter((apt: Appointment) => apt.status === 'NO_SHOW').length
                const avgDuration = result.data.length > 0 
                    ? result.data.reduce((sum: number, apt: any) => sum + (apt.durationMinutes || 30), 0) / result.data.length
                    : 0

                setStats({
                    totalAppointments: total,
                    confirmedCount: confirmed,
                    noShowCount: noShow,
                    averageDuration: Math.round(avgDuration)
                })
            } else {
                setAppointments([])
                setStats({ totalAppointments: 0, confirmedCount: 0, noShowCount: 0, averageDuration: 0 })
            }
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error)
            setAppointments([])
        } finally {
            setLoading(false)
        }
    }

    const handlePreviousDay = () => {
        setCurrentDate(subDays(currentDate, 1))
    }

    const handleNextDay = () => {
        setCurrentDate(addDays(currentDate, 1))
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    const getProcedureName = (appointment: Appointment) => {
        if (appointment.procedureRelation?.name) {
            return appointment.procedureRelation.name
        }
        if (appointment.procedureSnapshot?.name) {
            return appointment.procedureSnapshot.name
        }
        return 'Procedimento não informado'
    }

    const getStatusConfig = (status: AppointmentStatus) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED
    }

    const filteredAppointments = appointments

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#678380]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                            </svg>
                        </div>
                        <input
                            className="w-full h-10 pl-10 pr-4 bg-[#f1f4f3] dark:bg-gray-800 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20"
                            type="text"
                            value={selectedDateFormatted}
                            readOnly
                        />
                    </div>
                    <div className="flex gap-1 bg-[#f1f4f3] dark:bg-gray-800 p-1 rounded-lg">
                        <button 
                            onClick={handlePreviousDay}
                            className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm transition-all"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                        </button>
                        <button 
                            onClick={handleToday}
                            className={cn(
                                "p-1.5 rounded shadow-sm transition-all text-xs font-bold px-3",
                                isToday(currentDate) 
                                    ? "bg-white dark:bg-gray-700" 
                                    : "hover:bg-white dark:hover:bg-gray-700"
                            )}
                        >
                            HOJE
                        </button>
                        <button 
                            onClick={handleNextDay}
                            className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm transition-all"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    <Button
                        size="sm"
                        variant={statusFilter === null ? 'default' : 'outline'}
                        className={cn(statusFilter === null && 'bg-primary hover:bg-primary-dark')}
                        onClick={() => setStatusFilter(null)}
                    >
                        Todos
                    </Button>
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <Button
                            key={status}
                            size="sm"
                            variant={statusFilter === status ? 'default' : 'outline'}
                            className={cn(
                                'whitespace-nowrap',
                                statusFilter === status && 'bg-primary hover:bg-primary-dark'
                            )}
                            onClick={() => setStatusFilter(statusFilter === status ? null : status as AppointmentStatus)}
                        >
                            <div className={cn('size-2 rounded-full mr-2', config.dotColor)}></div>
                            {config.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-4 text-sm text-[#678380]">Carregando agendamentos...</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-[#678380]">Nenhum agendamento encontrado para esta data.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f1f4f3]/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Horário
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Paciente
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Procedimento
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-right">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredAppointments.map((appointment) => {
                                        const appointmentDate = parseISO(appointment.date)
                                        const timeStr = format(appointmentDate, 'HH:mm')
                                        const statusConfig = getStatusConfig(appointment.status)
                                        const procedureName = getProcedureName(appointment)
                                        const patientInitials = appointment.patient.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2)

                                        return (
                                            <tr
                                                key={appointment.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-[#121716] dark:text-white">
                                                        {timeStr}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center border border-gray-200">
                                                            <span className="text-xs font-bold text-primary">
                                                                {patientInitials}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                                                {appointment.patient.name}
                                                            </p>
                                                            <p className="text-[10px] text-[#678380]">
                                                                ID: {appointment.patient.id.slice(0, 8)}...
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-[#121716] dark:text-gray-300">
                                                        {procedureName}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold',
                                                            statusConfig.color
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'size-1.5 rounded-full mr-1.5',
                                                                statusConfig.dotColor
                                                            )}
                                                        ></div>
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => router.push(`/appointments/${appointment.id}`)}
                                                        className="p-1 text-[#678380] hover:text-primary transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-[#f1f4f3]/20 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <p className="text-xs text-[#678380]">
                                Mostrando <span className="font-bold text-[#121716] dark:text-white">{filteredAppointments.length}</span> consultas para {selectedDateFormatted}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#678380] text-xs font-medium">Total de Consultas</p>
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-primary">{stats.totalAppointments}</p>
                    <p className="text-[10px] text-[#678380] mt-1">Agendamentos para hoje</p>
                </div>
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#678380] text-xs font-medium">Tempo Médio/Atend.</p>
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-primary">
                        {stats.averageDuration} <span className="text-xs font-normal text-[#678380]">min</span>
                    </p>
                    <p className="text-[10px] text-[#678380] mt-1">Duração média</p>
                </div>
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#678380] text-xs font-medium">Faltas</p>
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-primary">{stats.noShowCount}</p>
                    <p className="text-[10px] text-[#678380] mt-1">Faltas confirmadas</p>
                </div>
            </div>
        </div>
    )
}
