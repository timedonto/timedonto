"use client"

import { useState, useEffect } from 'react'
import { UserRole } from '@prisma/client'
import { DentistsClient } from './client'
import { DentistFormModal } from '@/components/dentists'
import { Dentist } from './columns'

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
  const [specialties, setSpecialties] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

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

  // Carregar especialidades
  const fetchSpecialties = async () => {
    try {
      const response = await fetch('/api/specialties')
      if (response.ok) {
        const data = await response.json()
        setSpecialties(Array.isArray(data) ? data : [])
      } else {
        setSpecialties([])
      }
    } catch (err) {
      console.error('Erro ao carregar especialidades:', err)
      setSpecialties([])
    }
  }

  // Carregar usuários elegíveis para se tornarem dentistas
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/eligible')
      if (response.ok) {
        const result = await response.json()
        // A API retorna { success: true, data: UserOutput[] }
        setUsers(result.data || [])
      } else {
        setUsers([])
      }
    } catch (err) {
      console.error('Erro ao carregar usuários elegíveis:', err)
      setUsers([])
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      await fetchSession()
      await Promise.all([
        fetchDentists(),
        fetchSpecialties(),
        fetchUsers()
      ])
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

  const handleEditDentist = (dentist: Dentist) => {
    setSelectedDentist(dentist)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchDentists()
  }

  return (
    <>
      <DentistsClient
        data={dentists}
        loading={loading}
        onEdit={handleEditDentist}
        onDelete={handleDeleteDentist}
        onCreate={handleCreateDentist}
        canEdit={canEdit}
      />

      <DentistFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        dentist={selectedDentist as any}
        users={users}
        specialties={specialties}
        onSuccess={handleModalSuccess}
      />
    </>
  )
}