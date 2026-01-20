'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MOCK_APPOINTMENTS = [
    {
        id: '1',
        time: '08:00',
        patient: { name: 'Mariana Costa', id: '28402', avatar: null },
        procedure: 'Limpeza e Profilaxia',
        status: 'CONFIRMADO' as const,
    },
    {
        id: '2',
        time: '09:30',
        patient: { name: 'André Silveira', id: '28415', avatar: null },
        procedure: 'Ajuste de Aparelho',
        status: 'AGENDADO' as const,
    },
    {
        id: '3',
        time: '11:00',
        patient: { name: 'Beatriz Souza', id: '28430', avatar: null },
        procedure: 'Avaliação Cirúrgica',
        status: 'FALTA' as const,
    },
    {
        id: '4',
        time: '14:00',
        patient: { name: 'João Rocha', id: '28442', avatar: null },
        procedure: 'Implantodontia (Pilar)',
        status: 'CONFIRMADO' as const,
    },
]

const STATUS_CONFIG = {
    CONFIRMADO: {
        label: 'CONFIRMADO',
        color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
        dotColor: 'bg-green-500',
    },
    AGENDADO: {
        label: 'AGENDADO',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
        dotColor: 'bg-blue-500',
    },
    FALTA: {
        label: 'FALTA',
        color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        dotColor: 'bg-red-500',
    },
}

export function DentistScheduleTab() {
    const [selectedDate, setSelectedDate] = useState('24 de Maio, 2024')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

    const filteredAppointments = statusFilter
        ? MOCK_APPOINTMENTS.filter((apt) => apt.status === statusFilter)
        : MOCK_APPOINTMENTS

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
                            value={selectedDate}
                            readOnly
                        />
                    </div>
                    <div className="flex gap-1 bg-[#f1f4f3] dark:bg-gray-800 p-1 rounded-lg">
                        <button className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm transition-all">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                        </button>
                        <button className="p-1.5 bg-white dark:bg-gray-700 rounded shadow-sm transition-all text-xs font-bold px-3">
                            HOJE
                        </button>
                        <button className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm transition-all">
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
                            onClick={() => setStatusFilter(status)}
                        >
                            <div className={cn('size-2 rounded-full mr-2', config.dotColor)}></div>
                            {config.label}
                        </Button>
                    ))}
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                    <button className="flex items-center justify-center size-10 rounded-lg bg-[#f1f4f3] dark:bg-gray-800 text-[#678380] hover:text-primary transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
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
                            {filteredAppointments.map((appointment) => (
                                <tr
                                    key={appointment.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-[#121716] dark:text-white">
                                            {appointment.time}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center border border-gray-200">
                                                <span className="text-xs font-bold text-primary">
                                                    {appointment.patient.name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                                    {appointment.patient.name}
                                                </p>
                                                <p className="text-[10px] text-[#678380]">
                                                    ID: {appointment.patient.id}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-[#121716] dark:text-gray-300">
                                            {appointment.procedure}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold',
                                                STATUS_CONFIG[appointment.status].color
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'size-1.5 rounded-full mr-1.5',
                                                    STATUS_CONFIG[appointment.status].dotColor
                                                )}
                                            ></div>
                                            {STATUS_CONFIG[appointment.status].label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1 text-[#678380] hover:text-primary transition-colors">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 bg-[#f1f4f3]/20 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <p className="text-xs text-[#678380]">
                        Mostrando <span className="font-bold text-[#121716] dark:text-white">{filteredAppointments.length}</span> consultas para hoje
                    </p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors">
                            Ver Semana Completa
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#678380] text-xs font-medium">Taxa de Ocupação</p>
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-primary">85%</p>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-2">
                        <div className="bg-primary h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#678380] text-xs font-medium">Tempo Médio/Atend.</p>
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-primary">
                        45 <span className="text-xs font-normal text-[#678380]">min</span>
                    </p>
                    <p className="text-[10px] text-green-600 font-bold mt-1">Otimizado (Meta 50min)</p>
                </div>
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#678380] text-xs font-medium">Faltas no Mês</p>
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-primary">08</p>
                    <p className="text-[10px] text-red-500 font-bold mt-1">-15% que no mês passado</p>
                </div>
            </div>
        </div>
    )
}
