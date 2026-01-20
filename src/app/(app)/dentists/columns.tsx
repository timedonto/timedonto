"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"

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

export interface User {
    id: string
    name: string
    email: string
    isActive: boolean
}

export interface Dentist {
    id: string
    clinicId: string
    userId: string
    cro: string
    specialty: string | null
    workingHours: Record<string, any> | null
    bankInfo: Record<string, any> | null
    commission: number | null
    createdAt: string
    updatedAt: string
    user: User
}

interface ColumnsProps {
    onEdit: (dentist: Dentist) => void
    onDelete: (dentistId: string, dentistName: string) => void
    canEdit: boolean
}

export const getColumns = ({ onEdit, onDelete, canEdit }: ColumnsProps): ColumnDef<Dentist>[] => [
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
        id: "name",
        accessorKey: "user.name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Nome" />
        ),
        cell: ({ row }) => {
            const dentist = row.original
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-sm lg:text-base">{dentist.user.name}</span>
                    <span className="text-xs text-muted-foreground md:hidden line-clamp-1">{dentist.user.email}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "user.email",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => <div className="hidden md:block">{row.original.user.email}</div>,
    },
    {
        accessorKey: "cro",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="CRO" />
        ),
        cell: ({ row }) => (
            <code className="text-xs bg-muted px-2 py-1 rounded">
                {row.getValue("cro")}
            </code>
        ),
    },
    {
        id: "specialty",
        accessorKey: "specialty",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Especialidade" />
        ),
        cell: ({ row }) => (
            <div className="hidden lg:block">
                {row.getValue("specialty") || (
                    <span className="text-muted-foreground italic">Geral</span>
                )}
            </div>
        ),
        filterFn: (row, id, value) => {
            const specialty = row.getValue(id) as string | null
            if (!specialty) return value.includes("none")
            return value.some((v: string) => specialty.includes(v))
        },
    },
    {
        accessorKey: "commission",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Comissão" />
        ),
        cell: ({ row }) => {
            const commission = row.getValue("commission") as number | null
            return (
                <div className="hidden lg:block font-medium">
                    {commission !== null ? `${commission}%` : "-"}
                </div>
            )
        },
    },
    {
        id: "status",
        accessorKey: "user.isActive",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const isActive = !!row.original.user.isActive
            return (
                <Badge variant={isActive ? 'success' : 'destructive'}>
                    {isActive ? 'Ativo' : 'Inativo'}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            const val = !!row.original.user.isActive
            const mappedValue = val ? "active" : "inactive"
            return value.includes(mappedValue)
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const dentist = row.original

            if (!canEdit) return null

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
                            <DropdownMenuItem asChild>
                                <Link href={`/dentists/${dentist.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver detalhes
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(dentist)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar rápido
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(dentist.id, dentist.user.name)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir registro
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
