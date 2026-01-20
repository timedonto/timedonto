"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Calendar, User, Stethoscope, ClipboardList } from "lucide-react"
import { AppointmentStatus } from "@prisma/client"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header"

export interface Appointment {
    id: string
    clinicId: string
    dentistId: string
    patientId: string
    date: Date
    durationMinutes: number
    status: AppointmentStatus
    procedure: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    dentist: {
        id: string
        cro: string
        specialty: string | null
        user: {
            id: string
            name: string
            email: string
        }
    }
    patient: {
        id: string
        name: string
        email: string | null
        phone: string | null
    }
}

const statusLabels: Record<AppointmentStatus, string> = {
    SCHEDULED: 'Agendado',
    CONFIRMED: 'Confirmado',
    CANCELED: 'Cancelado',
    RESCHEDULED: 'Reagendado',
    NO_SHOW: 'Não Compareceu',
    DONE: 'Concluído'
}

const statusVariants: Record<AppointmentStatus, 'default' | 'secondary' | 'success' | 'outline' | 'destructive' | 'warning'> = {
    SCHEDULED: 'default',
    CONFIRMED: 'success',
    CANCELED: 'destructive',
    RESCHEDULED: 'secondary',
    NO_SHOW: 'warning',
    DONE: 'success'
}

interface ColumnsProps {
    onEdit: (appointment: Appointment) => void
}

export const getColumns = ({ onEdit }: ColumnsProps): ColumnDef<Appointment>[] => [
    {
        accessorKey: "date",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Data/Hora" />
        ),
        cell: ({ row }) => {
            const date = row.original.date
            return (
                <div className="flex flex-col">
                    <span className="font-medium">
                        {format(date, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {format(date, "HH:mm", { locale: ptBR })} ({row.original.durationMinutes}min)
                    </span>
                </div>
            )
        },
        sortingFn: "datetime",
    },
    {
        id: "patientName",
        accessorKey: "patient.name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Paciente" />
        ),
        cell: ({ row }) => {
            const patient = row.original.patient
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{patient.name}</span>
                    {patient.phone && (
                        <span className="text-xs text-muted-foreground">{patient.phone}</span>
                    )}
                </div>
            )
        },
    },
    {
        id: "dentistName",
        accessorKey: "dentist.user.name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Dentista" />
        ),
        cell: ({ row }) => {
            const dentist = row.original.dentist
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{dentist.user.name}</span>
                    <span className="text-xs text-muted-foreground">CRO: {dentist.cro}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "procedure",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Procedimento" />
        ),
        cell: ({ row }) => {
            return (
                <span className="text-muted-foreground italic">
                    {row.getValue("procedure") || "Não informado"}
                </span>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as AppointmentStatus
            return (
                <Badge variant={statusVariants[status]}>
                    {statusLabels[status]}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const appointment = row.original

            return (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(appointment)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar agendamento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => console.log("Ver detalhes", appointment.id)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Ver detalhes
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
