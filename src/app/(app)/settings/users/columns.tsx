"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, UserCheck, UserX } from "lucide-react"
import { UserRole } from "@prisma/client"

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
    clinicId: string
    name: string
    email: string
    role: UserRole
    isActive: boolean
    createdAt: string
    updatedAt: string
}

const roleLabels: Record<UserRole, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    DENTIST: 'Dentista',
    RECEPTIONIST: 'Recepcionista'
}

const roleVariants: Record<UserRole, 'default' | 'secondary' | 'success' | 'outline' | 'destructive' | 'warning'> = {
    OWNER: 'default',
    ADMIN: 'secondary',
    DENTIST: 'success',
    RECEPTIONIST: 'outline'
}

interface ColumnsProps {
    onEdit: (user: User) => void
    onToggleStatus: (userId: string, currentStatus: boolean) => void
    currentUserId?: string
}

export const getColumns = ({ onEdit, onToggleStatus, currentUserId }: ColumnsProps): ColumnDef<User>[] => [
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
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{row.getValue("name")}</span>
                    <span className="text-xs text-muted-foreground md:hidden line-clamp-1">{row.original.email}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => <div className="hidden md:block">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "role",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Cargo" />
        ),
        cell: ({ row }) => {
            const role = row.getValue("role") as UserRole
            return (
                <Badge variant={roleVariants[role]}>
                    {roleLabels[role]}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
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
            const user = row.original

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
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar cargo/dados
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onToggleStatus(user.id, user.isActive)}
                                disabled={currentUserId === user.id}
                                className={user.isActive ? "text-destructive focus:text-destructive" : "text-success focus:text-success"}
                            >
                                {user.isActive ? (
                                    <>
                                        <UserX className="mr-2 h-4 w-4" />
                                        {currentUserId === user.id ? 'Você não pode se desativar' : 'Desativar usuário'}
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Ativar usuário
                                    </>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
