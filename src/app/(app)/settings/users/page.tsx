"use client"

import * as React from "react"
import { UserRole } from '@/types/roles'
import { useSession } from 'next-auth/react'
import { UsersClient } from './client'
import { UserFormModal } from '@/components/users/user-form-modal'
import { RequireRole } from '@/components/auth/require-role'

interface User {
  id: string
  clinicId: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  data?: User[]
  error?: string
}

function UsersPageContent() {
  const { data: session } = useSession()
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | undefined>(undefined)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/users')
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar usuários')
      }

      if (data.success && data.data) {
        setUsers(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setError(null)
      setSuccessMessage(null)

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })

      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar usuário')
      }

      if (data.success) {
        setSuccessMessage(currentStatus ? 'Usuário desativado com sucesso' : 'Usuário ativado com sucesso')
        await fetchUsers()
        // Limpar mensagem após 3 segundos
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário'
      setError(errorMessage)
      // Limpar erro após 5 segundos
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleCreateUser = () => {
    setSelectedUser(undefined)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchUsers()
  }

  return (
    <>
      {/* Mensagens de feedback */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium">
            {error}
          </p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            {successMessage}
          </p>
        </div>
      )}

      <UsersClient
        initialData={users}
        loading={loading}
        onEdit={handleEditUser}
        onToggleStatus={toggleUserStatus}
        onCreate={handleCreateUser}
        currentUserId={session?.user?.id}
      />

      <UserFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={selectedUser as any}
        onSuccess={handleModalSuccess}
      />
    </>
  )
}

export default function UsersPage() {
  return (
    <RequireRole allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
      <UsersPageContent />
    </RequireRole>
  )
}