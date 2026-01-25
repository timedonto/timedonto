"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header"

export interface InventoryMovement {
    id: string
    clinicId: string
    itemId: string
    type: 'IN' | 'OUT'
    quantity: number
    appointmentId: string | null
    createdById: string
    notes: string | null
    createdAt: Date
    item?: {
        id: string
        name: string
        unit: string
    }
    createdBy?: {
        id: string
        name: string
    }
    appointment?: {
        id: string
        date: Date
        procedure: string | null
        patient?: {
            id: string
            name: string
        }
    }
}

// Determinar variante do badge de tipo
const getMovementTypeBadge = (type: 'IN' | 'OUT') => {
    return type === 'IN' 
        ? { variant: 'default' as const, label: 'Entrada' }
        : { variant: 'destructive' as const, label: 'Saída' }
}

// Formatar data para exibição
const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

export const getMovementColumns = (): ColumnDef<InventoryMovement>[] => [
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
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Data/Hora" />
        ),
        cell: ({ row }) => {
            const date = row.getValue("createdAt") as Date
            return (
                <div className="font-medium text-sm lg:text-base">
                    {formatDate(date)}
                </div>
            )
        },
        sortingFn: "datetime",
    },
    {
        id: "itemName",
        accessorFn: (row) => row.item?.name || 'Item não encontrado',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Item" />
        ),
        cell: ({ row }) => {
            const movement = row.original
            return (
                <div className="space-y-1">
                    <div className="font-medium text-sm lg:text-base">
                        {movement.item?.name || 'Item não encontrado'}
                    </div>
                    {movement.appointment?.patient && (
                        <div className="text-xs text-muted-foreground">
                            Paciente: {movement.appointment.patient.name}
                        </div>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "type",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Tipo" />
        ),
        cell: ({ row }) => {
            const type = row.getValue("type") as 'IN' | 'OUT'
            const badge = getMovementTypeBadge(type)
            return (
                <Badge variant={badge.variant} className="text-xs">
                    {badge.label}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        id: "quantity",
        accessorFn: (row) => `${row.quantity} ${row.item?.unit || ''}`,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Quantidade" />
        ),
        cell: ({ row }) => {
            const movement = row.original
            return (
                <div className="font-medium text-sm lg:text-base">
                    {movement.quantity} {movement.item?.unit || ''}
                </div>
            )
        },
    },
    {
        id: "createdBy",
        accessorFn: (row) => row.createdBy?.name || 'Usuário não encontrado',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Responsável" />
        ),
        cell: ({ row }) => {
            const movement = row.original
            return (
                <div className="text-muted-foreground text-sm lg:text-base">
                    {movement.createdBy?.name || 'Usuário não encontrado'}
                </div>
            )
        },
    },
    {
        accessorKey: "notes",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Observações" />
        ),
        cell: ({ row }) => {
            const notes = row.getValue("notes") as string | null
            return (
                <div className="text-muted-foreground text-sm lg:text-base max-w-[200px] truncate">
                    {notes || '-'}
                </div>
            )
        },
    },
]
