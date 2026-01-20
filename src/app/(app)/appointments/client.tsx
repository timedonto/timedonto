"use client"

import * as React from "react"
import { AppointmentStatus } from "@prisma/client"
import {
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar as CalendarIcon,
    AlertCircle,
    CheckCircle,
    Stethoscope,
    X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/data-table"
import { getColumns, Appointment } from "./columns"

interface DentistOption {
    id: string
    name: string
}

interface AppointmentsClientProps {
    initialData: Appointment[]
    dentists: DentistOption[]
    onEdit: (appointment: Appointment) => void
    onCreate: () => void
    loading?: boolean
    selectedDate: string
    onDateChange: (date: string) => void
}

export function AppointmentsClient({
    initialData,
    dentists,
    onEdit,
    onCreate,
    loading = false,
    selectedDate,
    onDateChange,
}: AppointmentsClientProps) {
    const columns = React.useMemo(
        () => getColumns({ onEdit }),
        [onEdit]
    )

    const dentistOptions = React.useMemo(() =>
        dentists.map(dentist => ({
            label: dentist.name,
            value: dentist.name,
            icon: Stethoscope,
        })),
        [dentists]
    )

    const statusOptions = [
        { label: "Agendado", value: "SCHEDULED", icon: CalendarIcon },
        { label: "Confirmado", value: "CONFIRMED", icon: CheckCircle },
        { label: "Reagendado", value: "RESCHEDULED", icon: Clock },
        { label: "Concluído", value: "DONE", icon: CheckCircle2 },
        { label: "Cancelado", value: "CANCELED", icon: XCircle },
        { label: "Não Compareceu", value: "NO_SHOW", icon: AlertCircle },
    ]

    // Sort data: nearest first (by date)
    const sortedData = React.useMemo(() => {
        return [...initialData].sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return dateA - dateB
        })
    }, [initialData])

    const dateFilter = (
        <div className="flex items-center gap-2">
            <div className="relative">
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="h-8 w-[150px] lg:w-[180px] pl-8"
                />
                <CalendarIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            </div>
            {selectedDate && (
                <Button
                    variant="ghost"
                    onClick={() => onDateChange("")}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
                    <p className="text-muted-foreground">
                        Gerencie os agendamentos e consultas da clínica
                    </p>
                </div>
                <Button onClick={onCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Agendamento
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={sortedData}
                searchKey="patientName"
                searchPlaceholder="Filtrar por paciente..."
                loading={loading}
                filters={[
                    {
                        columnId: "dentistName",
                        title: "Dentista",
                        options: dentistOptions,
                    },
                    {
                        columnId: "status",
                        title: "Status",
                        options: statusOptions,
                    },
                ]}
                extraToolbarContent={dateFilter}
            />
        </div>
    )
}
