"use client"

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Loader2, Search, AlertTriangle, History } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InventoryItemFormModal, InventoryMovementFormModal } from '@/components/inventory'
import { InventoryItemOutput } from '@/modules/inventory/domain/inventory-item.schema'

// Interface para dados da API (com datas como strings)
interface InventoryItemApiData {
  id: string
  clinicId: string
  name: string
  description: string | null
  unit: string
  currentQuantity: number
  minQuantity: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Converter dados da API para InventoryItemOutput
const convertApiDataToInventoryItem = (apiData: InventoryItemApiData): InventoryItemOutput => ({
  ...apiData,
  createdAt: new Date(apiData.createdAt),
  updatedAt: new Date(apiData.updatedAt),
})

// Interface para movimentações da API
interface InventoryMovementApiData {
  id: string
  clinicId: string
  itemId: string
  type: 'IN' | 'OUT'
  quantity: number
  appointmentId: string | null
  createdById: string
  notes: string | null
  createdAt: string
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
    date: string
    procedure: string | null
    patient?: {
      id: string
      name: string
    }
  }
}

interface InventoryMovementOutput {
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

// Converter dados da API para InventoryMovementOutput
const convertApiDataToInventoryMovement = (apiData: InventoryMovementApiData): InventoryMovementOutput => ({
  ...apiData,
  createdAt: new Date(apiData.createdAt),
  appointment: apiData.appointment ? {
    ...apiData.appointment,
    date: new Date(apiData.appointment.date)
  } : undefined
})

interface ApiResponse {
  success: boolean
  data?: InventoryItemApiData[]
  error?: string
}

interface MovementsApiResponse {
  success: boolean
  data?: InventoryMovementApiData[]
  error?: string
}

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItemOutput | undefined>(undefined)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)

  // Estados para movimentações
  const [movements, setMovements] = useState<InventoryMovementOutput[]>([])
  const [movementsLoading, setMovementsLoading] = useState(true)
  const [movementsError, setMovementsError] = useState<string | null>(null)
  const [selectedItemFilter, setSelectedItemFilter] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Filtrar itens baseado no termo de busca
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return inventoryItems
    }

    const term = searchTerm.toLowerCase().trim()
    return inventoryItems.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.unit.toLowerCase().includes(term)
    )
  }, [inventoryItems, searchTerm])

  // Carregar itens de estoque
  const fetchInventoryItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/inventory-items')
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar itens de estoque')
      }

      if (data.success && data.data) {
        const convertedItems = data.data.map(convertApiDataToInventoryItem)
        setInventoryItems(convertedItems)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar itens de estoque:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar itens de estoque')
    } finally {
      setLoading(false)
    }
  }

  // Carregar movimentações de estoque
  const fetchInventoryMovements = async () => {
    try {
      setMovementsLoading(true)
      setMovementsError(null)

      // Construir query parameters
      const params = new URLSearchParams()
      
      if (selectedItemFilter && selectedItemFilter !== 'all') {
        params.append('itemId', selectedItemFilter)
      }
      
      if (selectedTypeFilter && selectedTypeFilter !== 'all') {
        params.append('type', selectedTypeFilter)
      }
      
      if (fromDate) {
        params.append('from', new Date(fromDate).toISOString())
      }
      
      if (toDate) {
        params.append('to', new Date(toDate).toISOString())
      }

      const url = `/api/inventory-movements${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      const data: MovementsApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar movimentações')
      }

      if (data.success && data.data) {
        const convertedMovements = data.data.map(convertApiDataToInventoryMovement)
        // Limitar a 20 movimentações mais recentes
        setMovements(convertedMovements.slice(0, 20))
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar movimentações:', err)
      setMovementsError(err instanceof Error ? err.message : 'Erro ao carregar movimentações')
    } finally {
      setMovementsLoading(false)
    }
  }

  // Carregar itens e movimentações ao montar o componente
  useEffect(() => {
    fetchInventoryItems()
    fetchInventoryMovements()
  }, [])

  // Recarregar movimentações quando filtros mudarem
  useEffect(() => {
    fetchInventoryMovements()
  }, [selectedItemFilter, selectedTypeFilter, fromDate, toDate])

  // Handlers para ações
  const handleCreateItem = () => {
    setSelectedItem(undefined)
    setIsModalOpen(true)
  }

  const handleEditItem = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId)
    if (item) {
      setSelectedItem(item)
      setIsModalOpen(true)
    }
  }

  const handleModalSuccess = () => {
    fetchInventoryItems()
    fetchInventoryMovements() // Recarregar movimentações também
  }

  const handleCreateMovement = () => {
    setIsMovementModalOpen(true)
  }

  const handleMovementModalSuccess = () => {
    fetchInventoryItems() // Recarregar itens para atualizar quantidades
    fetchInventoryMovements() // Recarregar movimentações
  }

  // Formatar data para exibição
  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  // Determinar variante do badge de tipo
  const getMovementTypeBadge = (type: 'IN' | 'OUT') => {
    return type === 'IN' 
      ? { variant: 'default' as const, label: 'Entrada' }
      : { variant: 'destructive' as const, label: 'Saída' }
  }

  // Verificar se item está com estoque baixo
  const isLowStock = (item: InventoryItemOutput): boolean => {
    if (item.minQuantity === null) return false
    return item.currentQuantity <= item.minQuantity
  }

  // Determinar variante do badge de estoque
  const getStockBadgeVariant = (item: InventoryItemOutput): "default" | "destructive" | "secondary" => {
    if (!isLowStock(item)) return "default"
    return item.currentQuantity === 0 ? "destructive" : "secondary"
  }

  // Formatar quantidade para exibição
  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity} ${unit}`
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie os itens de estoque da clínica
          </p>
        </div>
        <Button onClick={handleCreateItem} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {/* Campo de busca */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição ou unidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="rounded-md border">
        {loading ? (
          // Estado de loading
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando itens de estoque...
            </div>
          </div>
        ) : error ? (
          // Estado de erro
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Erro ao carregar itens de estoque</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchInventoryItems} variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          // Estado vazio
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {searchTerm.trim() ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm.trim() 
                  ? 'Tente ajustar os termos da busca'
                  : 'Comece cadastrando o primeiro item de estoque da clínica'
                }
              </p>
            </div>
            {!searchTerm.trim() && (
              <Button onClick={handleCreateItem} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Primeiro Item
              </Button>
            )}
          </div>
        ) : (
          // Tabela de itens de estoque
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Qtd Atual</TableHead>
                <TableHead>Qtd Mínima</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        {item.name}
                        {isLowStock(item) && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStockBadgeVariant(item)}>
                      {formatQuantity(item.currentQuantity, item.unit)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.minQuantity !== null 
                      ? formatQuantity(item.minQuantity, item.unit)
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.isActive ? 'default' : 'secondary'}
                    >
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar item</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Seção de Movimentações Recentes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Movimentações Recentes</h2>
            <p className="text-muted-foreground">
              Histórico das últimas movimentações de estoque
            </p>
          </div>
          <Button onClick={handleCreateMovement} variant="outline" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Item:</label>
            <Select value={selectedItemFilter} onValueChange={setSelectedItemFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os itens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os itens</SelectItem>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Tipo:</label>
            <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="IN">Entrada</SelectItem>
                <SelectItem value="OUT">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">De:</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-[150px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Até:</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-[150px]"
            />
          </div>

          {(selectedItemFilter !== 'all' || selectedTypeFilter !== 'all' || fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedItemFilter('all')
                setSelectedTypeFilter('all')
                setFromDate('')
                setToDate('')
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Tabela de movimentações */}
        <div className="rounded-md border">
          {movementsLoading ? (
            // Estado de loading
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando movimentações...
              </div>
            </div>
          ) : movementsError ? (
            // Estado de erro
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Erro ao carregar movimentações</h3>
                <p className="text-muted-foreground">{movementsError}</p>
              </div>
              <Button onClick={fetchInventoryMovements} variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : movements.length === 0 ? (
            // Estado vazio
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Nenhuma movimentação encontrada</h3>
                <p className="text-muted-foreground">
                  Não há movimentações para os filtros selecionados
                </p>
              </div>
            </div>
          ) : (
            // Tabela de movimentações
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">
                      {formatDate(movement.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {movement.item?.name || 'Item não encontrado'}
                        </div>
                        {movement.appointment?.patient && (
                          <div className="text-sm text-muted-foreground">
                            Paciente: {movement.appointment.patient.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getMovementTypeBadge(movement.type).variant}>
                        {getMovementTypeBadge(movement.type).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {movement.quantity} {movement.item?.unit || ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.createdBy?.name || 'Usuário não encontrado'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
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
        items={inventoryItems}
        onSuccess={handleMovementModalSuccess}
      />
    </div>
  )
}