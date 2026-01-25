"use client"

import * as React from "react"
import { Plus, History, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { getColumns, InventoryItemOutput } from "./columns"
import { getMovementColumns, InventoryMovement } from "./movement-columns"
import { InventoryItemFormModal, InventoryMovementFormModal } from "@/components/inventory"

interface InventoryClientProps {
    items: InventoryItemOutput[]
    movements: InventoryMovement[]
    onEdit: (item: InventoryItemOutput) => void
    onCreateItem: () => void
    onCreateMovement: () => void
    onSuccess: () => void
    loading?: boolean
    movementsLoading?: boolean
}

export function InventoryClient({
    items,
    movements,
    onEdit,
    onCreateItem,
    onCreateMovement,
    onSuccess,
    loading = false,
    movementsLoading = false,
}: InventoryClientProps) {
    const [mounted, setMounted] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState<'items' | 'movements'>('items')
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [isMovementModalOpen, setIsMovementModalOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<InventoryItemOutput | undefined>(undefined)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const handleEdit = (item: InventoryItemOutput) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleCreateItem = () => {
        setSelectedItem(undefined)
        setIsModalOpen(true)
    }

    const handleModalSuccess = () => {
        setIsModalOpen(false)
        setSelectedItem(undefined)
        onSuccess()
    }

    const handleCreateMovement = () => {
        setIsMovementModalOpen(true)
    }

    const handleMovementModalSuccess = () => {
        setIsMovementModalOpen(false)
        onSuccess()
    }

    const columns = React.useMemo(
        () => getColumns({ onEdit: handleEdit }),
        []
    )

    const movementColumns = React.useMemo(
        () => getMovementColumns(),
        []
    )

    const statusOptions = [
        { label: "Ativo", value: "active", icon: CheckCircle2 },
        { label: "Inativo", value: "inactive", icon: XCircle },
    ]

    const stockStatusOptions = [
        { label: "Estoque Baixo", value: "low", icon: AlertTriangle },
        { label: "Estoque Normal", value: "normal", icon: CheckCircle2 },
    ]

    const movementTypeOptions = [
        { label: "Entrada", value: "IN", icon: Plus },
        { label: "Saída", value: "OUT", icon: History },
    ]

    // Calcular estatísticas
    const stats = React.useMemo(() => {
        const totalItems = items.length
        const lowStockItems = items.filter(item => {
            if (item.minQuantity === null) return false
            return item.currentQuantity <= item.minQuantity
        }).length
        const totalUnits = items.reduce((acc, item) => acc + item.currentQuantity, 0)
        const lastMovement = movements.length > 0 ? movements[0].createdAt : null

        return {
            totalItems,
            lowStockItems,
            totalUnits,
            lastMovement
        }
    }, [items, movements])

    if (!mounted) {
        return null
    }

    return (
        <div className="space-y-8">
            {/* Header da página */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Estoque</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Controle e movimentação de materiais odontológicos
                </p>
            </div>

            {/* Indicadores */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <div className="text-sm font-medium">Total de Itens</div>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{stats.totalItems}</div>
                        <p className="text-xs text-muted-foreground">Materiais cadastrados</p>
                    </div>
                </div>

                <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${stats.lowStockItems > 0 ? "border-amber-500 bg-amber-50/50" : ""}`}>
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <div className="text-sm font-medium">Estoque Baixo</div>
                        {stats.lowStockItems > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="p-6 pt-0">
                        <div className={`text-2xl font-bold ${stats.lowStockItems > 0 ? "text-amber-600" : ""}`}>
                            {stats.lowStockItems}
                        </div>
                        <p className="text-xs text-muted-foreground">Abaixo do estoque mínimo</p>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <div className="text-sm font-medium">Total em Unidades</div>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{stats.totalUnits}</div>
                        <p className="text-xs text-muted-foreground">Total de itens físicos</p>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <div className="text-sm font-medium">Última Movimentação</div>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-base font-bold truncate">
                            {stats.lastMovement 
                                ? new Date(stats.lastMovement).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })
                                : 'Nenhuma'
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">Registro mais recente</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 border-b">
                        <button
                            onClick={() => setActiveTab('items')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'items'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Itens do Estoque
                        </button>
                        <button
                            onClick={() => setActiveTab('movements')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'movements'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Movimentações
                        </button>
                    </div>
                    {activeTab === 'items' ? (
                        <Button onClick={handleCreateItem} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Novo Item</span>
                            <span className="sm:hidden">Novo</span>
                        </Button>
                    ) : (
                        <Button onClick={handleCreateMovement} variant="outline" className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            <span className="hidden sm:inline">Nova Movimentação</span>
                            <span className="sm:hidden">Nova</span>
                        </Button>
                    )}
                </div>

                {activeTab === 'items' ? (
                    <DataTable
                        columns={columns}
                        data={items}
                        searchKey="name"
                        searchPlaceholder="Buscar por nome, descrição ou unidade..."
                        loading={loading}
                        filters={[
                            {
                                columnId: "status",
                                title: "Status",
                                options: statusOptions,
                            },
                            {
                                columnId: "lowStock",
                                title: "Estoque",
                                options: stockStatusOptions,
                            },
                        ]}
                        getRowClassName={(item) => {
                            const lowStock = item.minQuantity !== null && item.currentQuantity <= item.minQuantity
                            return lowStock ? "bg-amber-50/30 hover:bg-amber-50/50" : ""
                        }}
                    />
                ) : (
                    <DataTable
                        columns={movementColumns}
                        data={movements}
                        searchKey="itemName"
                        searchPlaceholder="Buscar por item..."
                        loading={movementsLoading}
                        filters={[
                            {
                                columnId: "type",
                                title: "Tipo",
                                options: movementTypeOptions,
                            },
                        ]}
                    />
                )}
            </div>

            {/* Modal de criar/editar item */}
            <InventoryItemFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                item={selectedItem}
                onSuccess={handleModalSuccess}
            />

            {/* Modal de criar movimentação */}
            <InventoryMovementFormModal
                open={isMovementModalOpen}
                onOpenChange={setIsMovementModalOpen}
                items={items}
                onSuccess={handleMovementModalSuccess}
            />
        </div>
    )
}
