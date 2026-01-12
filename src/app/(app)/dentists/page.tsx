"use client"

import { useState, useEffect } from 'react'
import { UserRole } from '@prisma/client'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
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
import { DentistFormModal } from '@/components/dentists'

interface User {
  id: string
  name: string
  email: string
  isActive: boolean
}

interface Dentist {
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

interface ApiResponse {
  success: boolean
  data?: Dentist[]
  error?: string
}

interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  clinicId: string
}

interface SessionResponse {
  user?: SessionUser
}

export default function DentistsPage() {
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDentist, setSelectedDentist] = useState<Dentist | undefined>(undefined)

  // Verificar se usuário pode editar (OWNER ou ADMIN)
  const canEdit = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.ADMIN

  // Carregar sessão do usuário
  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data: SessionResponse = await response.json()
        if (data.user) {
          setCurrentUser(data.user)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar sessão:', err)
    }
  }

  // Carregar dentistas
  const fetchDentists = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dentists')
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar dentistas')
      }

      if (data.success && data.data) {
        setDentists(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar dentistas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar dentistas')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      await fetchSession()
      await fetchDentists()
    }
    loadData()
  }, [])

  // Excluir dentista
  const handleDeleteDentist = async (dentistId: string, dentistName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o dentista ${dentistName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/dentists/${dentistId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir dentista')
      }

      if (data.success) {
        // Recarregar lista
        await fetchDentists()
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao excluir dentista:', err)
      alert(err instanceof Error ? err.message : 'Erro ao excluir dentista')
    }
  }

  // Handlers para ações
  const handleCreateDentist = () => {
    setSelectedDentist(undefined)
    setIsModalOpen(true)
  }

  const handleEditDentist = (dentistId: string) => {
    const dentist = dentists.find(d => d.id === dentistId)
    if (dentist) {
      setSelectedDentist(dentist)
      setIsModalOpen(true)
    }
  }

  const handleModalSuccess = () => {
    fetchDentists()
  }

  // Formatar comissão como percentual
  const formatCommission = (commission: number | null) => {
    if (commission === null || commission === undefined) return '-'
    return `${commission}%`
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dentistas</h1>
          <p className="text-muted-foreground">
            Gerencie os dentistas da clínica
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleCreateDentist} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Dentista
          </Button>
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="rounded-md border">
        {loading ? (
          // Estado de loading
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando dentistas...
            </div>
          </div>
        ) : error ? (
          // Estado de erro
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Erro ao carregar dentistas</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchDentists} variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : dentists.length === 0 ? (
          // Estado vazio
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Nenhum dentista encontrado</h3>
              <p className="text-muted-foreground">
                {canEdit 
                  ? 'Comece cadastrando o primeiro dentista da clínica'
                  : 'Não há dentistas cadastrados na clínica'
                }
              </p>
            </div>
            {canEdit && (
              <Button onClick={handleCreateDentist} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Primeiro Dentista
              </Button>
            )}
          </div>
        ) : (
          // Tabela de dentistas
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CRO</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dentists.map((dentist) => (
                <TableRow key={dentist.id}>
                  <TableCell className="font-medium">
                    {dentist.user.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dentist.user.email}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {dentist.cro}
                    </code>
                  </TableCell>
                  <TableCell>
                    {dentist.specialty || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatCommission(dentist.commission)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={dentist.user.isActive ? 'success' : 'destructive'}
                    >
                      {dentist.user.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDentist(dentist.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar dentista</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDentist(dentist.id, dentist.user.name)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Excluir dentista</span>
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de criar/editar dentista */}
      <DentistFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        dentist={selectedDentist}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}