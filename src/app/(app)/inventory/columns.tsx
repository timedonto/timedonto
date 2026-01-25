"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header"
import { InventoryItemOutput } from "@/modules/inventory/domain/inventory-item.schema"

interface ColumnsProps {
    onEdit: (item: InventoryItemOutput) => void
}

// Verificar se item está com estoque baixo
const isLowStock = (item: InventoryItemOutput): boolean => {
    if (item.minQuantity === null) return false
    return item.currentQuantity <= item.minQuantity
}

// Determinar variante do badge de estoque
const getStockBadgeVariant = (item: InventoryItemOutput): "default" | "destructive" | "secondary" | "warning" => {
    if (!isLowStock(item)) return "default"
    return item.currentQuantity === 0 ? "destructive" : "warning"
}

// Formatar quantidade para exibição
const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity} ${unit}`
}

export const getColumns = ({ onEdit }: ColumnsProps): ColumnDef<InventoryItemOutput>[] => [
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
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Nome" />
        ),
        cell: ({ row }) => {
            const item = row.original
            const lowStock = isLowStock(item)
            return (
                <div className="space-y-1">
                    <div className="font-medium flex items-center gap-2 text-sm lg:text-base">
                        {item.name}
                        {lowStock && (
                            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                    </div>
                    {item.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                        </div>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "unit",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Unidade" />
        ),
        cell: ({ row }) => (
            <div className="text-muted-foreground text-sm lg:text-base">
                {row.getValue("unit")}
            </div>
        ),
    },
    {
        id: "currentQuantity",
        accessorKey: "currentQuantity",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Qtd Atual" />
        ),
        cell: ({ row }) => {
            const item = row.original
            const lowStock = isLowStock(item)
            return (
                <Badge 
                    variant={getStockBadgeVariant(item)} 
                    className={`text-xs px-2 py-0.5 ${lowStock ? "ring-1 ring-amber-200" : ""}`}
                >
                    {formatQuantity(item.currentQuantity, item.unit)}
                </Badge>
            )
        },
    },
    {
        id: "minQuantity",
        accessorKey: "minQuantity",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Qtd Mínima" />
        ),
        cell: ({ row }) => {
            const item = row.original
            return (
                <div className="text-muted-foreground text-sm lg:text-base">
                    {item.minQuantity !== null 
                        ? formatQuantity(item.minQuantity, item.unit)
                        : '-'
                    }
                </div>
            )
        },
    },
    {
        id: "status",
        accessorKey: "isActive",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const isActive = !!row.getValue("isActive")
            return (
                <Badge variant={isActive ? 'default' : 'secondary'}>
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
        id: "lowStock",
        accessorFn: (row) => isLowStock(row),
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Estoque Baixo" />
        ),
        cell: ({ row }) => {
            const lowStock = row.getValue("lowStock") as boolean
            return lowStock ? (
                <Badge variant="warning" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Baixo
                </Badge>
            ) : (
                <Badge variant="outline" className="text-xs">
                    Normal
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            const val = row.getValue(id) as boolean
            const mappedValue = val ? "low" : "normal"
            return value.includes(mappedValue)
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="h-8 w-8 p-0"
                    >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar item</span>
                    </Button>
                </div>
            )
        },
    },
]
