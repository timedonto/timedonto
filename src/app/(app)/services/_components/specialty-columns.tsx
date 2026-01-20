"use client"

import { ColumnDef } from "@tanstack/react-table"
import { SpecialtyOutput } from "@/modules/specialties/domain/specialty.schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react"

interface SpecialtyColumnsProps {
    onEdit: (specialty: SpecialtyOutput) => void
    onToggleStatus: (id: string, isActive: boolean) => void
}

export const getSpecialtyColumns = ({
    onEdit,
    onToggleStatus
}: SpecialtyColumnsProps): ColumnDef<SpecialtyOutput>[] => [
        {
            accessorKey: "name",
            header: "Nome",
        },
        {
            accessorKey: "description",
            header: "Descrição",
            cell: ({ row }) => row.getValue("description") || "-",
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
                const specialty = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(specialty)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleStatus(specialty.id, !specialty.isActive)}>
                                {specialty.isActive ? (
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
