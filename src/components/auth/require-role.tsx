"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/types/roles'
import { Loader2, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  clinicId: string
}

interface RequireRoleProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  redirectTo?: string
  showError?: boolean
}

const roleLabels: Record<UserRole, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  DENTIST: 'Dentista',
  RECEPTIONIST: 'Recepcionista'
}

export function RequireRole({ 
  allowedRoles, 
  children, 
  redirectTo = '/dashboard',
  showError = true 
}: RequireRoleProps) {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setCurrentUser(data.user)
            const userHasPermission = allowedRoles.includes(data.user.role)
            setHasPermission(userHasPermission)
            
            // Se não tem permissão e não deve mostrar erro, redirecionar
            if (!userHasPermission && !showError) {
              router.push(redirectTo)
              return
            }
          } else {
            // Usuário não autenticado
            router.push('/login')
            return
          }
        } else {
          // Erro na sessão
          router.push('/login')
          return
        }
      } catch (err) {
        console.error('Erro ao verificar permissões:', err)
        router.push('/login')
        return
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [allowedRoles, redirectTo, showError, router])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Verificando permissões...
        </div>
      </div>
    )
  }

  // Sem permissão - mostrar erro
  if (!hasPermission && showError) {
    const allowedRoleLabels = allowedRoles.map(role => roleLabels[role]).join(', ')
    const currentRoleLabel = currentUser?.role ? roleLabels[currentUser.role] : 'Desconhecido'

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-destructive/10 rounded-full">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Você não tem permissão para acessar esta página.
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
            <div>
              <span className="font-medium">Seu cargo atual:</span> {currentRoleLabel}
            </div>
            <div>
              <span className="font-medium">Cargos permitidos:</span> {allowedRoleLabels}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Voltar
          </Button>
          <Button 
            onClick={() => router.push(redirectTo)}
          >
            Ir para Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Com permissão - renderizar children
  if (hasPermission) {
    return <>{children}</>
  }

  // Fallback (não deve chegar aqui se showError=false)
  return null
}

export { roleLabels }