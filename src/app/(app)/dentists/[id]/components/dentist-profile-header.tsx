'use client'

import { ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface DentistProfileHeaderProps {
    dentist: {
        user: {
            name: string
            email: string
            isActive: boolean
        }
        cro: string
        specialty?: string | null
        procedures?: Array<{
            id: string
            name: string
            specialty?: {
                name: string
            } | null
        }>
    }
}

export function DentistProfileHeader({ dentist }: DentistProfileHeaderProps) {
    const router = useRouter()

    // Get unique specialties from procedures
    const specialties = dentist.procedures
        ? Array.from(
            new Set(
                dentist.procedures
                    .map((p) => p.specialty?.name)
                    .filter((name): name is string => !!name)
            )
        ).slice(0, 2) // Show max 2 specialties
        : dentist.specialty
            ? [dentist.specialty]
            : []

    return (
        <div className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex gap-6 items-center">
                    <div className="relative group">
                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-full h-24 w-24 ring-4 ring-primary/10 flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary">
                                {dentist.user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase()}
                            </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white dark:border-background-dark">
                            {dentist.user.isActive ? "ATIVO" : "INATIVO"}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-[#121716] dark:text-white text-2xl font-bold leading-tight tracking-tight">
                                {dentist.user.name}
                            </h1>
                        </div>
                        <p className="text-[#678380] dark:text-gray-400 text-sm font-medium mb-3 flex items-center gap-1">
                            <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            CRO: {dentist.cro}
                        </p>
                        {specialties.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {specialties.map((specialty, index) => (
                                    <div
                                        key={index}
                                        className="flex h-7 items-center justify-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3"
                                    >
                                        <svg
                                            className="w-3.5 h-3.5 text-primary"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4H6v-4h4V5h4v4h4v4h-4v4z" />
                                        </svg>
                                        <p className="text-primary text-xs font-semibold">
                                            {specialty}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <Button
                        variant="outline"
                        className="flex flex-1 md:flex-none items-center justify-center gap-2"
                        onClick={() => router.push("/dentists")}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar</span>
                    </Button>
                    <Button
                        className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-primary hover:bg-primary-dark shadow-md shadow-primary/20"
                    >
                        <Edit className="w-4 h-4" />
                        <span>Editar Perfil</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
