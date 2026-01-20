'use client'

interface DentistInfoTabProps {
    dentist: {
        user: {
            name: string
            email: string
        }
        cro: string
        specialty?: string | null
        commission?: number | null
        createdAt: Date | string
    }
}

export function DentistInfoTab({ dentist }: DentistInfoTabProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Info Card */}
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-[#f1f4f3]/50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-[#121716] dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                            </svg>
                            Dados Pessoais
                        </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                            <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                Nome Completo
                            </p>
                            <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                {dentist.user.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                CPF
                            </p>
                            <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                ---
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                Data de Nascimento
                            </p>
                            <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                ---
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                Gênero
                            </p>
                            <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                ---
                            </p>
                        </div>
                    </div>
                </div>

                {/* Professional Credentials Card */}
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-[#f1f4f3]/50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-[#121716] dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            Credenciais Profissionais
                        </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                            <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                Registro Profissional
                            </p>
                            <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                {dentist.cro}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                Data de Admissão
                            </p>
                            <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                {new Date(dentist.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                Especialidade
                            </p>
                            <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                {dentist.specialty || 'Clínico Geral'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                Disponibilidade
                            </p>
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-green-500"></div>
                                <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                    Horário Integral
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Details Card */}
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-[#f1f4f3]/50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-[#121716] dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                            Contato e Comunicação
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                    E-mail Corporativo
                                </p>
                                <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                    {dentist.user.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                    Telefone Principal
                                </p>
                                <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                    ---
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="size-10 rounded-lg bg-green-500/5 border border-green-500/10 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest">
                                    WhatsApp de Atendimento
                                </p>
                                <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                    ---
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address Info Card */}
                <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-[#f1f4f3]/50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-[#121716] dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            Endereço e Localização
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="col-span-2">
                                <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                    Logradouro
                                </p>
                                <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                    ---
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                    Bairro
                                </p>
                                <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                    ---
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                    Cidade / UF
                                </p>
                                <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                    ---
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-[#678380] uppercase tracking-widest mb-1">
                                    CEP
                                </p>
                                <p className="text-sm font-semibold text-[#121716] dark:text-white">
                                    ---
                                </p>
                            </div>
                        </div>
                        <div className="w-full h-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden group">
                            <div className="relative z-10 flex flex-col items-center">
                                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                                </svg>
                                <span className="text-[10px] font-bold text-primary uppercase mt-1">
                                    Ver no mapa
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Section */}
            <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-sm text-[#121716] dark:text-white uppercase tracking-wider">
                        Métricas do Mês
                    </h3>
                    <button className="text-primary text-xs font-bold hover:underline">
                        Ver Relatórios Completos
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-[#f1f4f3]/30 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        <p className="text-[#678380] text-xs font-medium mb-1">
                            Consultas Realizadas
                        </p>
                        <p className="text-2xl font-bold text-primary">---</p>
                        <div className="flex items-center text-[10px] text-green-600 font-bold mt-2">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                            </svg>
                            Em breve
                        </div>
                    </div>
                    <div className="bg-[#f1f4f3]/30 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        <p className="text-[#678380] text-xs font-medium mb-1">
                            Novos Orçamentos
                        </p>
                        <p className="text-2xl font-bold text-primary">---</p>
                        <div className="flex items-center text-[10px] text-primary font-bold mt-2">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            Em breve
                        </div>
                    </div>
                    <div className="bg-[#f1f4f3]/30 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        <p className="text-[#678380] text-xs font-medium mb-1">
                            Satisfação Paciente
                        </p>
                        <p className="text-2xl font-bold text-primary">
                            ---
                            <span className="text-sm font-normal text-[#678380]">/5</span>
                        </p>
                        <div className="flex items-center text-[10px] text-primary font-bold mt-2">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            </svg>
                            Em breve
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
