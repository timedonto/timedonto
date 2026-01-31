"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Calendar, User, Stethoscope, Play, CheckCircle2, XCircle } from "lucide-react"
import { AttendanceStatus } from "@/types/attendances"
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
import { AttendanceOutput } from "@/modules/attendance/domain/attendance.schema"

export type Attendance = AttendanceOutput

const statusLabels: Record<AttendanceStatus, string> = {
    CHECKED_IN: 'Check-in',
    IN_PROGRESS: 'Em Atendimento',
    DONE: 'Finalizado',
    CANCELED: 'Cancelado',
    NO_SHOW: 'Não Compareceu'
}

const statusVariants: Record<AttendanceStatus, 'default' | 'secondary' | 'success' | 'outline' | 'destructive' | 'warning'> = {
    CHECKED_IN: 'secondary',
    IN_PROGRESS: 'warning',
    DONE: 'success',
    CANCELED: 'destructive',
    NO_SHOW: 'outline'
}

interface ColumnsProps {
    onView: (attendance: Attendance) => void
    onStart?: (attendance: Attendance) => void
    onFinish?: (attendance: Attendance) => void
    onCancel?: (attendance: Attendance) => void
}

export const getColumns = ({ onView, onStart, onFinish, onCancel }: ColumnsProps): ColumnDef<Attendance>[] => [
    {
        accessorKey: "arrivalAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Chegada" />
        ),
        cell: ({ row }) => {
            const date = row.original.arrivalAt
            return (
                <div className="flex flex-col">
                    <span className="font-medium">
                        {format(date, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {format(date, "HH:mm", { locale: ptBR })}
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
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">{patient.name}</span>
                        <span className="text-xs text-muted-foreground">{patient.phone || patient.email || '-'}</span>
                    </div>
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
            if (!dentist) return <span className="text-muted-foreground italic text-xs">Não atribuído</span>
            return (
                <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{dentist.user.name}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const status = row.original.status as AttendanceStatus
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
            const attendance = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onView(attendance)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Ver detalhes
                        </DropdownMenuItem>
                        
                        {attendance.status === 'CHECKED_IN' && onStart && (
                            <DropdownMenuItem onClick={() => onStart(attendance)}>
                                <Play className="mr-2 h-4 w-4 text-blue-500" />
                                Iniciar atendimento
                            </DropdownMenuItem>
                        )}

                        {attendance.status === 'IN_PROGRESS' && onFinish && (
                            <DropdownMenuItem onClick={() => onFinish(attendance)}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                Finalizar atendimento
                            </DropdownMenuItem>
                        )}

                        {(attendance.status === 'CHECKED_IN' || attendance.status === 'IN_PROGRESS') && onCancel && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onCancel(attendance)} className="text-destructive">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancelar
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
