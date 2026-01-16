"use client"

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Loader2, Search, AlertTriangle, History, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState('items')

  // Estados para paginação dos itens
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Estados para paginação das movimentações
  const [currentMovementsPage, setCurrentMovementsPage] = useState(1)
  const [movementsPerPage, setMovementsPerPage] = useState(10)

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

  // Paginação dos itens filtrados
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredItems.slice(startIndex, endIndex)
  }, [filteredItems, currentPage, itemsPerPage])

  // Calcular informações de paginação
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const totalItems = filteredItems.length

  // Resetar página quando busca mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Paginação das movimentações
  const paginatedMovements = useMemo(() => {
    const startIndex = (currentMovementsPage - 1) * movementsPerPage
    const endIndex = startIndex + movementsPerPage
    return movements.slice(startIndex, endIndex)
  }, [movements, currentMovementsPage, movementsPerPage])

  // Calcular informações de paginação das movimentações
  const totalMovementsPages = Math.ceil(movements.length / movementsPerPage)
  const totalMovements = movements.length

  // Resetar página das movimentações quando filtros mudarem
  useEffect(() => {
    setCurrentMovementsPage(1)
  }, [selectedItemFilter, selectedTypeFilter, fromDate, toDate])

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

  // Estatísticas para indicadores
  const stats = useMemo(() => {
    const totalItems = inventoryItems.length
    const lowStockItems = inventoryItems.filter(isLowStock).length
    const totalUnits = inventoryItems.reduce((acc, item) => acc + item.currentQuantity, 0)
    const lastMovement = movements.length > 0 ? movements[0].createdAt : null

    return {
      totalItems,
      lowStockItems,
      totalUnits,
      lastMovement
    }
  }, [inventoryItems, movements])

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Materiais cadastrados</p>
          </CardContent>
        </Card>

        <Card className={stats.lowStockItems > 0 ? "border-amber-500 bg-amber-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            {stats.lowStockItems > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.lowStockItems > 0 ? "text-amber-600" : ""}`}>
              {stats.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Abaixo do estoque mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Unidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-muted-foreground">Total de itens físicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Movimentação</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">
              {stats.lastMovement ? formatDate(stats.lastMovement) : 'Nenhuma'}
            </div>
            <p className="text-xs text-muted-foreground">Registro mais recente</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="items">Itens do Estoque</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Campo de busca */}
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, descrição ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>
            <Button onClick={handleCreateItem} className="flex items-center gap-2 self-end sm:self-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Item</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>

          <div className="rounded-md border bg-white">
            {loading ? (
              // Estado de loading
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm sm:text-base">Carregando itens de estoque...</span>
                </div>
              </div>
            ) : error ? (
              // Estado de erro
              <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-semibold">Erro ao carregar itens de estoque</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{error}</p>
                </div>
                <Button onClick={fetchInventoryItems} variant="outline" size="sm">
                  Tentar novamente
                </Button>
              </div>
            ) : totalItems === 0 ? (
              // Estado vazio
              <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {searchTerm.trim() ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {searchTerm.trim() 
                      ? 'Tente ajustar os termos da busca'
                      : 'Comece cadastrando o primeiro item de estoque da clínica'
                    }
                  </p>
                </div>
                {!searchTerm.trim() && (
                  <Button onClick={handleCreateItem} className="flex items-center gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Cadastrar Primeiro Item</span>
                    <span className="sm:hidden">Cadastrar Item</span>
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Layout Mobile - Cards */}
                <div className="md:hidden space-y-4 p-4 bg-muted/5">
                  {paginatedItems.map((item) => (
                    <div 
                      key={item.id}
                      className={`border rounded-lg p-4 space-y-3 bg-white ${isLowStock(item) ? "border-amber-200" : ""}`}
                    >
                      {/* Nome e Status */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium flex items-center gap-2">
                            {item.name}
                            {isLowStock(item) && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                          )}
                        </div>
                        <Badge 
                          variant={item.isActive ? 'default' : 'secondary'}
                          className="text-xs ml-2"
                        >
                          {item.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      {/* Unidade e Quantidades */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Unidade</div>
                          <div className="text-xs font-medium">{item.unit}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Qtd Atual</div>
                          <Badge variant={getStockBadgeVariant(item)} className="text-xs">
                            {item.currentQuantity}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Qtd Mínima</div>
                          <div className="text-xs">
                            {item.minQuantity !== null ? item.minQuantity : '-'}
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center justify-end pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="sr-only">Editar item</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Layout Desktop/Tablet - Tabela */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs lg:text-sm">Nome</TableHead>
                        <TableHead className="text-xs lg:text-sm">Unidade</TableHead>
                        <TableHead className="text-xs lg:text-sm">Qtd Atual</TableHead>
                        <TableHead className="text-xs lg:text-sm hidden lg:table-cell">Qtd Mínima</TableHead>
                        <TableHead className="text-xs lg:text-sm">Status</TableHead>
                        <TableHead className="text-xs lg:text-sm text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((item) => (
                        <TableRow key={item.id} className={isLowStock(item) ? "bg-amber-50/30" : ""}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center gap-2 text-xs lg:text-sm">
                                {item.name}
                                {isLowStock(item) && (
                                  <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-amber-500" />
                                )}
                              </div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs lg:text-sm">
                            {item.unit}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getStockBadgeVariant(item)} 
                              className={`text-xs px-2 py-0.5 ${isLowStock(item) ? "ring-1 ring-amber-200" : ""}`}
                            >
                              {formatQuantity(item.currentQuantity, item.unit)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs lg:text-sm hidden lg:table-cell">
                            {item.minQuantity !== null 
                              ? formatQuantity(item.minQuantity, item.unit)
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={item.isActive ? 'default' : 'secondary'}
                              className="text-xs"
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
                </div>
              </>
            )}
          </div>

          {/* Informações de paginação e controles */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              {/* Informações da paginação */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} a{' '}
                  {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} itens
                </span>
                <div className="flex items-center gap-2">
                  <span>Itens por página:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Controles de paginação */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Página anterior</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Primeira página */}
                    {currentPage > 3 && (
                      <>
                        <Button
                          variant={1 === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          className="h-8 w-8 p-0"
                        >
                          1
                        </Button>
                        {currentPage > 4 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                      </>
                    )}

                    {/* Páginas próximas à atual */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page >= Math.max(1, currentPage - 2) && 
                               page <= Math.min(totalPages, currentPage + 2)
                      })
                      .map(page => (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0"
                        >
                          {page}
                        </Button>
                      ))
                    }

                    {/* Última página */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={totalPages === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="h-8 w-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Próxima página</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Histórico de Movimentações</h2>
              <p className="text-sm text-muted-foreground">
                Acompanhe as entradas e saídas de materiais
              </p>
            </div>
            <Button onClick={handleCreateMovement} variant="outline" className="flex items-center gap-2 self-end sm:self-auto">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Movimentação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>

          <Card className="p-4 bg-muted/10 border-dashed">
            {/* Filtros */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:flex-wrap sm:items-center sm:space-y-0 sm:gap-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                <label className="text-xs sm:text-sm font-medium">Item:</label>
                <Select value={selectedItemFilter} onValueChange={setSelectedItemFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] text-xs sm:text-sm">
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

              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                <label className="text-xs sm:text-sm font-medium">Tipo:</label>
                <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] text-xs sm:text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="IN">Entrada</SelectItem>
                    <SelectItem value="OUT">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                <label className="text-xs sm:text-sm font-medium text-nowrap">De:</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full sm:w-[150px] text-xs sm:text-sm"
                />
              </div>

              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                <label className="text-xs sm:text-sm font-medium text-nowrap">Até:</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full sm:w-[150px] text-xs sm:text-sm"
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
                  className="w-full sm:w-auto"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </Card>

          <div className="rounded-md border bg-white">
            {movementsLoading ? (
              // Estado de loading
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm sm:text-base">Carregando movimentações...</span>
                </div>
              </div>
            ) : movementsError ? (
              // Estado de erro
              <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-semibold">Erro ao carregar movimentações</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{movementsError}</p>
                </div>
                <Button onClick={fetchInventoryMovements} variant="outline" size="sm">
                  Tentar novamente
                </Button>
              </div>
            ) : totalMovements === 0 ? (
              // Estado vazio
              <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-semibold">Nenhuma movimentação encontrada</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Não há movimentações para os filtros selecionados
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Layout Mobile - Cards */}
                <div className="md:hidden space-y-4 p-4 bg-muted/5">
                  {paginatedMovements.map((movement) => (
                    <div 
                      key={movement.id}
                      className="border rounded-lg p-4 space-y-3 bg-white"
                    >
                      {/* Data e Tipo */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{formatDate(movement.createdAt)}</div>
                        </div>
                        <Badge variant={getMovementTypeBadge(movement.type).variant} className="text-xs ml-2">
                          {getMovementTypeBadge(movement.type).label}
                        </Badge>
                      </div>

                      {/* Item */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Item</div>
                        <div className="text-sm font-medium">
                          {movement.item?.name || 'Item não encontrado'}
                        </div>
                        {movement.appointment?.patient && (
                          <div className="text-xs text-muted-foreground">
                            Paciente: {movement.appointment.patient.name}
                          </div>
                        )}
                      </div>

                      {/* Quantidade e Responsável */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Quantidade</div>
                          <div className="text-sm font-medium">
                            {movement.quantity} {movement.item?.unit || ''}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Responsável</div>
                          <div className="text-xs truncate">
                            {movement.createdBy?.name || 'Usuário não encontrado'}
                          </div>
                        </div>
                      </div>

                      {/* Observações */}
                      {movement.notes && (
                        <div className="pt-2 border-t">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Observações</div>
                          <div className="text-xs text-muted-foreground italic">{movement.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Layout Desktop/Tablet - Tabela */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs lg:text-sm">Data</TableHead>
                        <TableHead className="text-xs lg:text-sm">Item</TableHead>
                        <TableHead className="text-xs lg:text-sm">Tipo</TableHead>
                        <TableHead className="text-xs lg:text-sm">Quantidade</TableHead>
                        <TableHead className="text-xs lg:text-sm hidden lg:table-cell">Responsável</TableHead>
                        <TableHead className="text-xs lg:text-sm hidden lg:table-cell">Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium text-xs lg:text-sm">
                            {formatDate(movement.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs lg:text-sm">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {movement.item?.name || 'Item não encontrado'}
                              </div>
                              {movement.appointment?.patient && (
                                <div className="text-xs text-muted-foreground">
                                  Paciente: {movement.appointment.patient.name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getMovementTypeBadge(movement.type).variant} className="text-xs">
                              {getMovementTypeBadge(movement.type).label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs lg:text-sm">
                            <span className="font-medium">
                              {movement.quantity} {movement.item?.unit || ''}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs lg:text-sm hidden lg:table-cell">
                            {movement.createdBy?.name || 'Usuário não encontrado'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs lg:text-sm hidden lg:table-cell">
                            {movement.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          {/* Informações de paginação e controles para movimentações */}
          {totalMovements > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              {/* Informações da paginação */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Mostrando {Math.min((currentMovementsPage - 1) * movementsPerPage + 1, totalMovements)} a{' '}
                  {Math.min(currentMovementsPage * movementsPerPage, totalMovements)} de {totalMovements} movimentações
                </span>
                <div className="flex items-center gap-2">
                  <span>Itens por página:</span>
                  <Select
                    value={movementsPerPage.toString()}
                    onValueChange={(value) => {
                      setMovementsPerPage(Number(value))
                      setCurrentMovementsPage(1)
                    }}
                  >
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Controles de paginação */}
              {totalMovementsPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMovementsPage(Math.max(1, currentMovementsPage - 1))}
                    disabled={currentMovementsPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Página anterior</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Primeira página */}
                    {currentMovementsPage > 3 && (
                      <>
                        <Button
                          variant={1 === currentMovementsPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentMovementsPage(1)}
                          className="h-8 w-8 p-0"
                        >
                          1
                        </Button>
                        {currentMovementsPage > 4 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                      </>
                    )}

                    {/* Páginas próximas à atual */}
                    {Array.from({ length: totalMovementsPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page >= Math.max(1, currentMovementsPage - 2) && 
                               page <= Math.min(totalMovementsPages, currentMovementsPage + 2)
                      })
                      .map(page => (
                        <Button
                          key={page}
                          variant={page === currentMovementsPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentMovementsPage(page)}
                          className="h-8 w-8 p-0"
                        >
                          {page}
                        </Button>
                      ))
                    }

                    {/* Última página */}
                    {currentMovementsPage < totalMovementsPages - 2 && (
                      <>
                        {currentMovementsPage < totalMovementsPages - 3 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={totalMovementsPages === currentMovementsPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentMovementsPage(totalMovementsPages)}
                          className="h-8 w-8 p-0"
                        >
                          {totalMovementsPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMovementsPage(Math.min(totalMovementsPages, currentMovementsPage + 1))}
                    disabled={currentMovementsPage === totalMovementsPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Próxima página</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

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