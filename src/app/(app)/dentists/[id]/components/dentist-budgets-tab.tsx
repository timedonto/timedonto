'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TreatmentPlanStatus } from '@prisma/client'
import { cn } from '@/lib/utils'

interface TreatmentPlan {
    id: string
    createdAt: string
    patient: {
        id: string
        name: string
    }
    finalAmount: number
    status: TreatmentPlanStatus
}

interface DentistBudgetsTabProps {
    dentistId: string
}

const STATUS_CONFIG: Record<TreatmentPlanStatus, { label: string; color: string; dotColor: string }> = {
    OPEN: {
        label: 'ABERTO',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
        dotColor: 'bg-blue-500',
    },
    APPROVED: {
        label: 'APROVADO',
        color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
        dotColor: 'bg-green-500',
    },
    REJECTED: {
        label: 'REJEITADO',
        color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        dotColor: 'bg-red-500',
    },
}

export function DentistBudgetsTab({ dentistId }: DentistBudgetsTabProps) {
    const router = useRouter()
    const [statusFilter, setStatusFilter] = useState<TreatmentPlanStatus | null>(null)
    const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTreatmentPlans()
    }, [statusFilter, dentistId])

    const fetchTreatmentPlans = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                dentistId
            })

            if (statusFilter) {
                params.append('status', statusFilter)
            }

            const response = await fetch(`/api/treatment-plans?${params.toString()}`)
            const result = await response.json()

            if (result.success && result.data) {
                setTreatmentPlans(result.data)
            } else {
                setTreatmentPlans([])
            }
        } catch (error) {
            console.error('Erro ao buscar orçamentos:', error)
            setTreatmentPlans([])
        } finally {
            setLoading(false)
        }
    }

    const getStatusConfig = (status: TreatmentPlanStatus) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.OPEN
    }

    const filteredPlans = treatmentPlans

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-[#121716] dark:text-white">
                            Orçamentos
                        </h3>
                        <p className="text-sm text-[#678380] dark:text-gray-400">
                            Lista de todos os orçamentos criados por este profissional.
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
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
                                value={statusFilter || 'all'}
                                onChange={(e) => setStatusFilter(e.target.value === 'all' ? null : e.target.value as TreatmentPlanStatus)}
                            >
                                <option value="all">Todos os status</option>
                                <option value="OPEN">Aberto</option>
                                <option value="APPROVED">Aprovado</option>
                                <option value="REJECTED">Rejeitado</option>
                            </select>
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-4 text-sm text-[#678380]">Carregando orçamentos...</p>
                    </div>
                ) : filteredPlans.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-[#678380]">Nenhum orçamento encontrado.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f1f4f3]/50 dark:bg-gray-800/50">
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Data de Criação
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Paciente
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-right">
                                            Valor Total
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-right">
                                            Ação
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredPlans.map((plan) => {
                                        const planDate = parseISO(plan.createdAt)
                                        const dateStr = format(planDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
                                        const statusConfig = getStatusConfig(plan.status)

                                        return (
                                            <tr
                                                key={plan.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-[#121716] dark:text-white">
                                                        {dateStr}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {plan.patient.name
                                                                .split(' ')
                                                                .map((n) => n[0])
                                                                .join('')
                                                                .toUpperCase()
                                                                .slice(0, 2)}
                                                        </div>
                                                        <span className="text-sm font-medium text-[#121716] dark:text-white">
                                                            {plan.patient.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold text-[#121716] dark:text-white">
                                                        R$ {plan.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
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
                                                        onClick={() => router.push(`/treatment-plans/${plan.id}`)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                                        </svg>
                                                        Ver Detalhes
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
                                Exibindo {filteredPlans.length} orçamento{filteredPlans.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
