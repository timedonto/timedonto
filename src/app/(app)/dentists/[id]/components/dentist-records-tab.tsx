'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Attendance {
    id: string
    finishedAt: Date | null
    arrivalAt: Date
    patient: {
        id: string
        name: string
    }
    procedures: Array<{
        id: string
        description: string
        procedure?: {
            name: string
        } | null
    }>
    record?: {
        id: string
    } | null
}

interface DentistRecordsTabProps {
    dentistId: string
}

export function DentistRecordsTab({ dentistId }: DentistRecordsTabProps) {
    const router = useRouter()
    const [filter, setFilter] = useState('all')
    const [attendances, setAttendances] = useState<Attendance[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAttendances()
    }, [filter, dentistId])

    const fetchAttendances = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                dentistId,
                status: 'DONE'
            })

            // Aplicar filtro de período
            if (filter === 'last30days') {
                const dateFrom = new Date()
                dateFrom.setDate(dateFrom.getDate() - 30)
                params.append('dateFrom', dateFrom.toISOString())
            } else if (filter === 'thisYear') {
                const dateFrom = new Date(new Date().getFullYear(), 0, 1)
                params.append('dateFrom', dateFrom.toISOString())
            }

            const response = await fetch(`/api/attendances?${params.toString()}`)
            const result = await response.json()

            if (result.success && result.data) {
                setAttendances(result.data)
            } else {
                setAttendances([])
            }
        } catch (error) {
            console.error('Erro ao buscar atendimentos:', error)
            setAttendances([])
        } finally {
            setLoading(false)
        }
    }

    const getPatientInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getProceduresSummary = (attendance: Attendance) => {
        if (attendance.procedures.length === 0) {
            return 'Nenhum procedimento registrado'
        }
        if (attendance.procedures.length === 1) {
            return attendance.procedures[0].procedure?.name || attendance.procedures[0].description
        }
        return `${attendance.procedures.length} procedimentos realizados`
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-[#121716] dark:text-white">
                            Registros de Atendimento
                        </h3>
                        <p className="text-sm text-[#678380] dark:text-gray-400">
                            Lista de todos os atendimentos finalizados por este profissional.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                            </svg>
                            <select
                                className="pl-9 pr-8 py-2 bg-[#f1f4f3] dark:bg-gray-800 border-none rounded-lg text-sm text-[#121716] dark:text-white focus:ring-primary appearance-none"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">Todos os pacientes</option>
                                <option value="last30days">Últimos 30 dias</option>
                                <option value="thisYear">Este ano</option>
                            </select>
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-4 text-sm text-[#678380]">Carregando atendimentos...</p>
                    </div>
                ) : attendances.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-[#678380]">Nenhum atendimento finalizado encontrado.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f1f4f3]/50 dark:bg-gray-800/50">
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Data
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Paciente
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Procedimentos Realizados
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-right">
                                            Ação
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {attendances.map((attendance) => {
                                        const attendanceDate = attendance.finishedAt 
                                            ? parseISO(attendance.finishedAt.toString())
                                            : parseISO(attendance.arrivalAt.toString())
                                        const dateStr = format(attendanceDate, 'dd/MM/yyyy', { locale: ptBR })
                                        const timeStr = format(attendanceDate, 'HH:mm')
                                        const patientInitials = getPatientInitials(attendance.patient.name)
                                        const proceduresSummary = getProceduresSummary(attendance)

                                        return (
                                            <tr
                                                key={attendance.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-[#121716] dark:text-white">
                                                            {dateStr}
                                                        </span>
                                                        <span className="text-xs text-[#678380]">{timeStr}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {patientInitials}
                                                        </div>
                                                        <span className="text-sm font-medium text-[#121716] dark:text-white">
                                                            {attendance.patient.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <svg
                                                            className="w-4 h-4 text-primary"
                                                            fill="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                                                        </svg>
                                                        <span className="text-sm text-[#678380] dark:text-gray-400">
                                                            {proceduresSummary}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => router.push(`/attendances/${attendance.id}`)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                                        </svg>
                                                        Ver Prontuário
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <p className="text-xs text-[#678380] dark:text-gray-400">
                                Exibindo {attendances.length} atendimento{attendances.length !== 1 ? 's' : ''} finalizado{attendances.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
