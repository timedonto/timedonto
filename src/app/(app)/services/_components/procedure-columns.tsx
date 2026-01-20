"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ProcedureOutput } from "@/modules/procedures/domain/procedure.schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react"

interface ProcedureColumnsProps {
    onEdit: (procedure: ProcedureOutput) => void
    onToggleStatus: (id: string, isActive: boolean) => void
}

export const getProcedureColumns = ({
    onEdit,
    onToggleStatus
}: ProcedureColumnsProps): ColumnDef<ProcedureOutput>[] => [
        {
            accessorKey: "name",
            header: "Nome",
        },
        {
            accessorKey: "baseValue",
            header: "Valor Base",
            cell: ({ row }) => {
                const value = Number(row.getValue("baseValue"))
                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
            }
        },
        {
            accessorKey: "commissionPercentage",
            header: "Comissão",
            cell: ({ row }) => `${row.getValue("commissionPercentage")}%`,
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("isActive")
                return (
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Ativo" : "Inativo"}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const procedure = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(procedure)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleStatus(procedure.id, !procedure.isActive)}>
                                {procedure.isActive ? (
                                    <>
                                        <PowerOff className="mr-2 h-4 w-4" />
                                        Inativar
                                    </>
                                ) : (
                                    <>
                                        <Power className="mr-2 h-4 w-4" />
                                        Ativar
                                    </>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ]
