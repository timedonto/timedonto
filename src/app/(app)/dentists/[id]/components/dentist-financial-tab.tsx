'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface FinancialTransaction {
    id: string
    date: string
    patientId: string
    patientName: string
    procedureName: string
    grossValue: number
    commission: number
    commissionType: 'GENERAL' | 'PROCEDURE'
    status: 'PAGO' | 'PENDENTE'
    source: 'TREATMENT_PLAN' | 'ATTENDANCE'
    sourceId: string
}

interface FinancialData {
    commissionPercentage: number | null
    grossProduction: number
    totalReceived: number
    totalPending: number
    netReceived: number
    transactions: FinancialTransaction[]
}

interface DentistFinancialTabProps {
    dentistId: string
}

export function DentistFinancialTab({ dentistId }: DentistFinancialTabProps) {
    const [financialData, setFinancialData] = useState<FinancialData | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')
    const [patientFilter, setPatientFilter] = useState<string>('')
    const [commissionTypeFilter, setCommissionTypeFilter] = useState<'GENERAL' | 'PROCEDURE' | null>(null)

    useEffect(() => {
        fetchFinancialData()
    }, [dateFrom, dateTo, patientFilter, commissionTypeFilter, dentistId])

    const fetchFinancialData = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (dateFrom) params.append('dateFrom', dateFrom)
            if (dateTo) params.append('dateTo', dateTo)
            if (patientFilter) params.append('patientId', patientFilter)
            if (commissionTypeFilter) params.append('commissionType', commissionTypeFilter)

            const response = await fetch(`/api/dentists/${dentistId}/financial?${params.toString()}`)
            const result = await response.json()

            if (result.success && result.data) {
                setFinancialData(result.data)
            } else {
                setFinancialData(null)
            }
        } catch (error) {
            console.error('Erro ao buscar dados financeiros:', error)
            setFinancialData(null)
        } finally {
            setLoading(false)
        }
    }
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-sm text-[#678380]">Carregando dados financeiros...</p>
                </div>
            </div>
        )
    }

    if (!financialData) {
        return (
            <div className="space-y-6">
                <div className="p-12 text-center">
                    <p className="text-sm text-[#678380]">Erro ao carregar dados financeiros.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-[#678380] text-xs font-bold uppercase tracking-wider mb-1">
                                Comissão (%)
                            </p>
                            <h3 className="text-2xl font-bold text-[#121716] dark:text-white">
                                {financialData.commissionPercentage ? `${financialData.commissionPercentage}%` : 'N/A'}
                            </h3>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                        <div className="text-[10px] text-green-600 font-bold flex items-center">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                            </svg>
                            {financialData.commissionPercentage ? 'Fixo contratual' : 'Não configurado'}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-[#678380] text-xs font-bold uppercase tracking-wider mb-1">
                                Produção Bruta
                            </p>
                            <h3 className="text-2xl font-bold text-[#121716] dark:text-white">
                                R$ {financialData.grossProduction.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                        <div className="text-[10px] text-primary font-bold flex items-center">
                            Total acumulado
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-[#678380] text-xs font-bold uppercase tracking-wider mb-1">
                                Total a Receber
                            </p>
                            <h3 className="text-2xl font-bold text-primary">
                                R$ {financialData.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                        <div className="text-[10px] text-orange-500 font-bold flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                            </svg>
                            Comissões pendentes
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-[#678380] text-xs font-bold uppercase tracking-wider mb-1">
                                Total Recebido
                            </p>
                            <h3 className="text-2xl font-bold text-green-600">
                                R$ {financialData.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-[#678380] text-xs font-bold uppercase tracking-wider mb-1">
                                Valor Líquido
                            </p>
                            <h3 className="text-2xl font-bold text-[#121716] dark:text-white">
                                R$ {financialData.netReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-sm text-[#121716] dark:text-white uppercase tracking-wider">
                            Histórico de Recebimentos e Comissões
                        </h3>
                        <p className="text-xs text-[#678380]">Últimos lançamentos registrados no período</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800"
                            placeholder="Data inicial"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800"
                            placeholder="Data final"
                        />
                        <select
                            value={commissionTypeFilter || 'all'}
                            onChange={(e) => setCommissionTypeFilter(e.target.value === 'all' ? null : e.target.value as 'GENERAL' | 'PROCEDURE')}
                            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800"
                        >
                            <option value="all">Todos os tipos</option>
                            <option value="GENERAL">Comissão Geral</option>
                            <option value="PROCEDURE">Por Procedimento</option>
                        </select>
                    </div>
                </div>
                {financialData.transactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-[#678380]">Nenhuma transação encontrada no período selecionado.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f1f4f3]/50 dark:bg-gray-800/50">
                                        <th className="px-6 py-3 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Data
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                            Paciente / Procedimento
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-right">
                                            Valor Bruto
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-right">
                                            Comissão
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-center">
                                            Tipo
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {financialData.transactions.map((transaction) => {
                                        const transactionDate = parseISO(transaction.date)
                                        const dateStr = format(transactionDate, 'dd/MM/yyyy', { locale: ptBR })

                                        return (
                                            <tr
                                                key={transaction.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-[#121716] dark:text-white">
                                                    {dateStr}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-[#121716] dark:text-white">
                                                            {transaction.patientName}
                                                        </span>
                                                        <span className="text-[11px] text-[#678380]">
                                                            {transaction.procedureName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#121716] dark:text-white text-right">
                                                    R$ {transaction.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-primary text-right">
                                                    R$ {transaction.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                                        {transaction.commissionType === 'PROCEDURE' ? 'Por Procedimento' : 'Geral'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                                                            transaction.status === 'PAGO'
                                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                        )}
                                                    >
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                            <p className="text-[11px] text-[#678380]">
                                Mostrando {financialData.transactions.length} lançamento{financialData.transactions.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
