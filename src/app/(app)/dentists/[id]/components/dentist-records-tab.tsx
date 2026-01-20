'use client'

import { useState } from 'react'

const MOCK_RECORDS = [
    {
        id: '1',
        date: '24/05/2024',
        time: '14:30',
        patient: { name: 'Ana Maria Silva', initials: 'AM' },
        appointment: 'Manutenção Ortodôntica',
    },
    {
        id: '2',
        date: '22/05/2024',
        time: '09:00',
        patient: { name: 'João Souza', initials: 'JS' },
        appointment: 'Avaliação Implantodontia',
    },
    {
        id: '3',
        date: '20/05/2024',
        time: '16:15',
        patient: { name: 'Carla Lima', initials: 'CL' },
        appointment: 'Instalação de Aparelho',
    },
    {
        id: '4',
        date: '18/05/2024',
        time: '11:00',
        patient: { name: 'Roberto Pereira', initials: 'RP' },
        appointment: 'Cirurgia de Implante',
    },
    {
        id: '5',
        date: '15/05/2024',
        time: '15:45',
        patient: { name: 'Márcia Toledo', initials: 'MT' },
        appointment: 'Ajuste de Prótese',
    },
]

export function DentistRecordsTab() {
    const [filter, setFilter] = useState('Todos os pacientes')

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-[#121716] dark:text-white">
                            Registros de Atendimento
                        </h3>
                        <p className="text-sm text-[#678380] dark:text-gray-400">
                            Lista de todos os prontuários clínicos gerados por este profissional.
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
                                <option>Todos os pacientes</option>
                                <option>Últimos 30 dias</option>
                                <option>Este ano</option>
                            </select>
                        </div>
                    </div>
                </div>
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
                                    Consulta Vinculada
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-right">
                                    Ação
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {MOCK_RECORDS.map((record) => (
                                <tr
                                    key={record.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-[#121716] dark:text-white">
                                                {record.date}
                                            </span>
                                            <span className="text-xs text-[#678380]">{record.time}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {record.patient.initials}
                                            </div>
                                            <span className="text-sm font-medium text-[#121716] dark:text-white">
                                                {record.patient.name}
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
                                                {record.appointment}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                            </svg>
                                            Ver Prontuário
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <p className="text-xs text-[#678380] dark:text-gray-400">
                        Exibindo 1-5 de 48 prontuários
                    </p>
                    <div className="flex gap-2">
                        <button
                            className="size-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            disabled
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                        </button>
                        <button className="size-8 flex items-center justify-center rounded bg-primary text-white font-bold text-xs">
                            1
                        </button>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 text-xs font-medium">
                            2
                        </button>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 text-xs font-medium">
                            3
                        </button>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
