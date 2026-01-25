"use client"

import * as React from "react"
import { Plus, Trash2, Search, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CID {
    id: string
    cidCode: string
    description: string
    observation: string | null
    category?: string | null
}

interface CIDOption {
    id: string
    code: string
    category: string
    description: string
}

interface AttendanceCIDTabProps {
    attendanceId: string
    initialCIDs: CID[]
    readOnly?: boolean
}

export function AttendanceCIDTab({ attendanceId, initialCIDs, readOnly = false }: AttendanceCIDTabProps) {
    const [cids, setCids] = React.useState<CID[]>(initialCIDs)
    const [loading, setLoading] = React.useState(false)
    
    // CID Search
    const [searchQuery, setSearchQuery] = React.useState("")
    const [searchResults, setSearchResults] = React.useState<CIDOption[]>([])
    const [isSearchOpen, setIsSearchOpen] = React.useState(false)
    const [isSearching, setIsSearching] = React.useState(false)
    const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    
    // CID Form
    const [cidCode, setCidCode] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [observation, setObservation] = React.useState("")
    const [selectedCID, setSelectedCID] = React.useState<CIDOption | null>(null)

    // Buscar CIDs
    const searchCIDs = React.useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([])
            setIsSearchOpen(false)
            return
        }

        setIsSearching(true)
        setIsSearchOpen(true) // Abrir o Popover enquanto busca
        try {
            const url = `/api/cids?q=${encodeURIComponent(query)}`
            console.log('🔍 Buscando CIDs:', url)
            const response = await fetch(url)
            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Erro HTTP:', response.status, errorText)
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            console.log('📦 Resposta da API:', data)
            if (data.success) {
                const results = data.data || []
                console.log(`✅ ${results.length} CIDs encontrados`)
                setSearchResults(results)
                // Manter o Popover aberto se houver resultados
                setIsSearchOpen(results.length > 0 || query.trim().length > 0)
            } else {
                console.error('❌ Erro na resposta da API:', data.error)
                setSearchResults([])
                setIsSearchOpen(false)
            }
        } catch (err) {
            console.error('❌ Erro ao buscar CIDs:', err)
            setSearchResults([])
            setIsSearchOpen(false)
        } finally {
            setIsSearching(false)
        }
    }, [])

    // Debounce da busca
    React.useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (searchQuery.trim()) {
            searchTimeoutRef.current = setTimeout(() => {
                searchCIDs(searchQuery)
            }, 300)
        } else {
            setSearchResults([])
            setIsSearchOpen(false)
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchQuery, searchCIDs])

    // Selecionar CID da busca
    const handleSelectCID = (cid: CIDOption) => {
        setSelectedCID(cid)
        setCidCode(cid.code)
        setDescription(cid.description)
        setSearchQuery("")
        setSearchResults([])
        setIsSearchOpen(false)
    }

    // Limpar seleção
    const handleClearSelection = () => {
        setSelectedCID(null)
        setCidCode("")
        setDescription("")
        setObservation("")
        setSearchQuery("")
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            const response = await fetch(`/api/attendances/${attendanceId}/cids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cidCode, description, observation })
            })
            const data = await response.json()
            if (data.success) {
                setCids(data.data.cids)
                handleClearSelection()
            } else {
                alert(data.error || 'Erro ao adicionar CID')
            }
        } catch (err) {
            console.error('Erro ao adicionar CID:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (cidId: string) => {
        if (!confirm('Tem certeza que deseja remover este CID?')) {
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/attendances/${attendanceId}/cids?cidId=${cidId}`, {
                method: 'DELETE',
            })
            const data = await response.json()
            if (data.success) {
                setCids(data.data.cids)
            } else {
                alert(data.error || 'Erro ao remover CID')
            }
        } catch (err) {
            console.error('Erro ao remover CID:', err)
            alert('Erro ao remover CID')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {!readOnly && (
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Diagnóstico (CID)</CardTitle>
                        <CardDescription>
                            Busque e selecione um CID da lista. Os campos serão preenchidos automaticamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Campo de busca */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Buscar e Selecionar CID</label>
                                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Digite o código, categoria ou descrição do CID..."
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value)
                                                    if (e.target.value.trim()) {
                                                        setIsSearchOpen(true)
                                                    }
                                                }}
                                                onFocus={() => {
                                                    if (searchQuery.trim() || searchResults.length > 0) {
                                                        setIsSearchOpen(true)
                                                    }
                                                }}
                                                className="pl-10"
                                                disabled={!!selectedCID}
                                            />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent 
                                        className="w-[var(--radix-popover-trigger-width)] p-0" 
                                        align="start"
                                        side="bottom"
                                        sideOffset={4}
                                    >
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {isSearching ? (
                                                <div className="p-4 text-center text-sm text-muted-foreground">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                        <span>Buscando...</span>
                                                    </div>
                                                </div>
                                            ) : searchQuery.trim() && searchResults.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-muted-foreground">
                                                    <div>Nenhum CID encontrado para &quot;{searchQuery}&quot;</div>
                                                    <div className="text-xs mt-1">Tente buscar por código (ex: S03.2), categoria ou descrição</div>
                                                </div>
                                            ) : searchResults.length > 0 ? (
                                                <div className="divide-y">
                                                    {searchResults.map((cid) => (
                                                        <button
                                                            key={cid.id}
                                                            type="button"
                                                            onClick={() => handleSelectCID(cid)}
                                                            className="w-full p-3 text-left hover:bg-accent transition-colors focus:bg-accent focus:outline-none"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-sm">{cid.code}</span>
                                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                                    {cid.category}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm mt-1 line-clamp-2">
                                                                {cid.description}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 text-center text-sm text-muted-foreground">
                                                    <div>Digite para buscar CIDs</div>
                                                    <div className="text-xs mt-1">Busque por código, categoria ou descrição</div>
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* CID Selecionado */}
                            {selectedCID && (
                                <div className="p-3 bg-muted rounded-md border border-primary/20">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Check className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium text-primary">CID Selecionado</span>
                                            </div>
                                            <div className="text-sm font-semibold">{selectedCID.code}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{selectedCID.category}</div>
                                            <div className="text-sm mt-1">{selectedCID.description}</div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleClearSelection}
                                            className="h-8 w-8"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Formulário de adição */}
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Código CID</label>
                                        <Input 
                                            placeholder="Ex: K02.0" 
                                            value={cidCode} 
                                            onChange={(e) => {
                                                setCidCode(e.target.value.toUpperCase())
                                                if (selectedCID && e.target.value !== selectedCID.code) {
                                                    setSelectedCID(null)
                                                }
                                            }}
                                            required
                                            disabled={!!selectedCID}
                                            className={selectedCID ? "bg-muted" : ""}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">Descrição</label>
                                        <Input 
                                            placeholder="Descrição do diagnóstico" 
                                            value={description} 
                                            onChange={(e) => {
                                                setDescription(e.target.value)
                                                if (selectedCID && e.target.value !== selectedCID.description) {
                                                    setSelectedCID(null)
                                                }
                                            }}
                                            required
                                            disabled={!!selectedCID}
                                            className={selectedCID ? "bg-muted" : ""}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Observação (opcional)</label>
                                    <Input 
                                        placeholder="Observações adicionais sobre o diagnóstico" 
                                        value={observation} 
                                        onChange={(e) => setObservation(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" disabled={loading || !cidCode || !description} className="w-full md:w-auto">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {loading ? "Adicionando..." : "Adicionar CID ao Atendimento"}
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Diagnósticos Registrados</CardTitle>
                </CardHeader>
                <CardContent>
                    {cids.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground italic">
                            Nenhum CID registrado para este atendimento.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Código</TableHead>
                                    <TableHead className="w-[180px]">Categoria</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Observação</TableHead>
                                    {!readOnly && <TableHead className="w-[100px]"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cids.map((cid) => (
                                    <TableRow key={cid.id}>
                                        <TableCell className="font-bold">{cid.cidCode}</TableCell>
                                        <TableCell>
                                            {cid.category ? (
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    {cid.category}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{cid.description}</TableCell>
                                        <TableCell className="text-muted-foreground">{cid.observation || '-'}</TableCell>
                                        {!readOnly && (
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(cid.id)} className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
