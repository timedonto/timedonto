"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Eye, UserCheck, UserX } from "lucide-react"
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
import { PatientOutput } from "@/modules/patients/domain/patient.schema"

// Formatar CPF para exibição
const formatCpf = (cpf: string | null) => {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// Formatar telefone para exibição
const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    if (phone.length === 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
}

interface ColumnsProps {
    onEdit: (patient: PatientOutput) => void
    onView: (patientId: string) => void
    onToggleStatus?: (patientId: string, currentStatus: boolean) => void
}

export const getColumns = ({ onEdit, onView, onToggleStatus }: ColumnsProps): ColumnDef<PatientOutput>[] => [
    {
        id: "index",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="#" />
        ),
        cell: ({ row }) => (
            <div className="w-[30px]">{row.index + 1}</div>
        ),
        enableSorting: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Nome" />
        ),
        cell: ({ row }) => {
            const patient = row.original
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{patient.name}</span>
                    <span className="text-xs text-muted-foreground md:hidden line-clamp-1">
                        {formatPhone(patient.phone)}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => <div className="hidden md:block">{row.getValue("email") || "-"}</div>,
    },
    {
        accessorKey: "phone",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Telefone" />
        ),
        cell: ({ row }) => <div className="hidden md:block">{formatPhone(row.getValue("phone"))}</div>,
    },
    {
        accessorKey: "cpf",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="CPF" />
        ),
        cell: ({ row }) => <div className="hidden lg:block">{formatCpf(row.getValue("cpf"))}</div>,
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Cadastro" />
        ),
        cell: ({ row }) => {
            const date = row.getValue("createdAt") as Date
            return (
                <div className="hidden lg:block">
                    {format(date, "dd/MM/yyyy", { locale: ptBR })}
                </div>
            )
        },
    },
    {
        accessorKey: "isActive",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const isActive = !!row.getValue("isActive")
            return (
                <Badge variant={isActive ? 'success' : 'destructive'}>
                    {isActive ? 'Ativo' : 'Inativo'}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            const val = !!row.getValue(id)
            const mappedValue = val ? "active" : "inactive"
            return value.includes(mappedValue)
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const patient = row.original

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
                            <DropdownMenuItem onClick={() => onView(patient.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver prontuário
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(patient)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar dados
                            </DropdownMenuItem>
                            {onToggleStatus && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onToggleStatus(patient.id, patient.isActive)}
                                        className={patient.isActive ? "text-destructive focus:text-destructive" : "text-success focus:text-success"}
                                    >
                                        {patient.isActive ? (
                                            <>
                                                <UserX className="mr-2 h-4 w-4" />
                                                Desativar paciente
                                            </>
                                        ) : (
                                            <>
                                                <UserCheck className="mr-2 h-4 w-4" />
                                                Ativar paciente
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
