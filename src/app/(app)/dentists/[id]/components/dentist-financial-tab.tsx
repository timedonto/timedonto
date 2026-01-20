'use client'

const MOCK_FINANCIAL_DATA = {
    commission: 45,
    grossProduction: 48250.0,
    totalReceivable: 21712.5,
    closingCycleDays: 4,
    transactions: [
        {
            id: '1',
            date: '12/12/2024',
            patient: 'Ana Beatriz Silva',
            procedure: 'Instalação de Aparelho Autoligado',
            grossValue: 1800.0,
            commission: 810.0,
            status: 'PENDENTE' as const,
        },
        {
            id: '2',
            date: '10/12/2024',
            patient: 'Marcos Vinícius',
            procedure: 'Implante Dentário Titânio',
            grossValue: 3500.0,
            commission: 1575.0,
            status: 'PAGO' as const,
        },
        {
            id: '3',
            date: '08/12/2024',
            patient: 'Clara Mendes',
            procedure: 'Manutenção Ortodôntica',
            grossValue: 250.0,
            commission: 112.5,
            status: 'PAGO' as const,
        },
        {
            id: '4',
            date: '05/12/2024',
            patient: 'Roberto Ferreira',
            procedure: 'Prótese Fixa (3 elementos)',
            grossValue: 4200.0,
            commission: 1890.0,
            status: 'PENDENTE' as const,
        },
    ],
}

export function DentistFinancialTab() {
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
                                {MOCK_FINANCIAL_DATA.commission}%
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
                            Fixo contratual
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
                                R$ {MOCK_FINANCIAL_DATA.grossProduction.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                            Este mês (Dez)
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
                                R$ {MOCK_FINANCIAL_DATA.totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                            Ciclo de fechamento em {MOCK_FINANCIAL_DATA.closingCycleDays} dias
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
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-[#678380] hover:bg-gray-50 dark:hover:bg-gray-800">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                            </svg>
                            Filtrar
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />
                            </svg>
                            Exportar PDF
                        </button>
                    </div>
                </div>
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
                                    Comissão ({MOCK_FINANCIAL_DATA.commission}%)
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-[#678380] uppercase tracking-widest text-center">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-[#678380] uppercase tracking-widest"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {MOCK_FINANCIAL_DATA.transactions.map((transaction) => (
                                <tr
                                    key={transaction.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="px-6 py-4 text-sm font-medium text-[#121716] dark:text-white">
                                        {transaction.date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-[#121716] dark:text-white">
                                                {transaction.patient}
                                            </span>
                                            <span className="text-[11px] text-[#678380]">
                                                {transaction.procedure}
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
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${transaction.status === 'PAGO'
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                }`}
                                        >
                                            {transaction.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-[#678380] hover:text-primary">
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
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[11px] text-[#678380]">
                        Mostrando {MOCK_FINANCIAL_DATA.transactions.length} de 28 lançamentos
                    </p>
                    <div className="flex gap-2">
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-[#678380] disabled:opacity-50">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                        </button>
                        <button className="size-8 flex items-center justify-center rounded border border-primary bg-primary text-white text-xs font-bold">
                            1
                        </button>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-[#678380] text-xs font-bold hover:border-primary">
                            2
                        </button>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-[#678380] text-xs font-bold hover:border-primary">
                            3
                        </button>
                        <button className="size-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-[#678380]">
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
