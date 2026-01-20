'use client'

import { useState, useTransition } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DentistServicesTabProps {
    dentist: {
        id: string
        procedures?: Array<{
            id: string
        }>
    }
    availableProcedures: Array<{
        id: string
        name: string
        specialty?: {
            name: string
        } | null
        baseValue: number
    }>
    onSave: (procedureIds: string[]) => Promise<{ success: boolean; error?: string }>
    canManage: boolean
}

export function DentistServicesTab({
    dentist,
    availableProcedures,
    onSave,
    canManage,
}: DentistServicesTabProps) {
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [selectedProcedures, setSelectedProcedures] = useState<string[]>(
        dentist.procedures?.map((p) => p.id) || []
    )
    const [filter, setFilter] = useState('')

    const handleToggleProcedure = (procedureId: string) => {
        setSelectedProcedures((prev) =>
            prev.includes(procedureId)
                ? prev.filter((id) => id !== procedureId)
                : [...prev, procedureId]
        )
    }

    const handleSave = () => {
        setMessage(null)
        startTransition(async () => {
            const result = await onSave(selectedProcedures)
            if (result.success) {
                setMessage({ type: 'success', text: 'Procedimentos atualizados com sucesso!' })
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao atualizar procedimentos' })
            }
        })
    }

    // Group procedures by specialty
    const groupedProcedures = availableProcedures.reduce((acc, proc) => {
        const specialtyName = proc.specialty?.name || 'Sem Especialidade'
        if (!acc[specialtyName]) {
            acc[specialtyName] = []
        }
        acc[specialtyName].push(proc)
        return acc
    }, {} as Record<string, typeof availableProcedures>)

    // Filter procedures
    const filteredGroups = Object.entries(groupedProcedures).reduce((acc, [specialty, procs]) => {
        const filtered = procs.filter((p) =>
            p.name.toLowerCase().includes(filter.toLowerCase())
        )
        if (filtered.length > 0) {
            acc[specialty] = filtered
        }
        return acc
    }, {} as Record<string, typeof availableProcedures>)

    return (
        <div className="space-y-8 pb-20">
            {message && (
                <div
                    className={cn(
                        'p-4 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300',
                        message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                    )}
                >
                    {message.type === 'success' ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                    )}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-[#121716] dark:text-white">
                        Gerenciamento de Procedimentos
                    </h3>
                    <p className="text-sm text-[#678380]">
                        Selecione os procedimentos que este profissional está autorizado a realizar na clínica.
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#678380]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                    </svg>
                    <input
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-primary focus:border-primary"
                        placeholder="Filtrar procedimentos..."
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {Object.entries(filteredGroups).map(([specialty, procedures]) => (
                <div key={specialty}>
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4H6v-4h4V5h4v4h4v4h-4v4z" />
                        </svg>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-[#678380]">
                            {specialty}
                        </h4>
                        <div className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800 ml-2"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {procedures.map((proc) => (
                            <label
                                key={proc.id}
                                className={cn(
                                    'bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-4 cursor-pointer transition-all flex items-start gap-4 shadow-sm hover:border-primary hover:bg-primary/5',
                                    selectedProcedures.includes(proc.id) && 'border-primary/30 bg-primary/5'
                                )}
                            >
                                <Checkbox
                                    checked={selectedProcedures.includes(proc.id)}
                                    onCheckedChange={() => handleToggleProcedure(proc.id)}
                                    disabled={!canManage || isPending}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-[#121716] dark:text-white">
                                        {proc.name}
                                    </p>
                                    <p className="text-[11px] text-[#678380] mt-1">
                                        R$ {proc.baseValue.toFixed(2)}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            {canManage && availableProcedures.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-40">
                    <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
                        <p className="text-sm text-[#678380] hidden sm:block">
                            Alterações não salvas serão perdidas ao sair desta página.
                        </p>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <button
                                className="flex-1 sm:flex-none h-11 px-8 rounded-lg text-sm font-bold text-[#678380] hover:bg-gray-100 transition-colors"
                                onClick={() => setSelectedProcedures(dentist.procedures?.map((p) => p.id) || [])}
                            >
                                Descartar
                            </button>
                            <Button
                                onClick={handleSave}
                                disabled={isPending}
                                className="flex-1 sm:flex-none h-11 px-8 bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
