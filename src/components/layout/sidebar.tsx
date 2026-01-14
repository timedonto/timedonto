'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@prisma/client'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  DollarSign,
  Package,
  BarChart3,
  Settings,
  UserCog,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/config/constants'

interface MenuItem {
  href: string
  label: string
  icon: any
  requiredRoles?: UserRole[]
}

// Links principais
const mainMenuItems: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/appointments', label: 'Agenda', icon: Calendar },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/dentists', label: 'Dentistas', icon: Stethoscope },
  { href: '/treatment-plans', label: 'Orçamentos', icon: FileText },
  { 
    href: '/finance', 
    label: 'Financeiro', 
    icon: DollarSign,
    requiredRoles: [UserRole.OWNER, UserRole.ADMIN]
  },
  { href: '/inventory', label: 'Estoque', icon: Package },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
]

// Links de configurações (apenas OWNER e ADMIN)
const settingsMenuItems: MenuItem[] = [
  { href: '/settings/users', label: 'Usuários', icon: UserCog },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  clinicId: string
}

export function Sidebar() {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar se usuário pode acessar configurações (OWNER ou ADMIN)
  const canAccessSettings = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.ADMIN

  // Verificar se usuário pode acessar um item do menu
  const canAccessMenuItem = (item: MenuItem): boolean => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true // Item disponível para todos
    }
    return currentUser?.role ? item.requiredRoles.includes(currentUser.role) : false
  }

  // Buscar sessão do usuário
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setCurrentUser(data.user)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar sessão:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  // Função para renderizar item do menu
  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon
    const isActive = pathname === item.href || 
      (item.href !== '/dashboard' && pathname.startsWith(item.href))

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center px-4 py-3 rounded-lg font-medium transition-all group',
          isActive
            ? 'bg-primary text-white'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
      >
        <Icon className={cn(
          "mr-3 h-5 w-5",
          isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
        )} />
        {item.label}
      </Link>
    )
  }

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-heading tracking-tight">{APP_NAME}</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {/* Menu principal */}
        <div className="space-y-1">
          {mainMenuItems
            .filter(canAccessMenuItem)
            .map(renderMenuItem)}
        </div>

        {/* Separador e menu de configurações (apenas OWNER/ADMIN) */}
        {!loading && canAccessSettings && (
          <>
            <div className="my-4 border-t border-slate-200 dark:border-slate-700" />
            <div className="space-y-1">
              {settingsMenuItems.map(renderMenuItem)}
            </div>
          </>
        )}
      </nav>

      {/* Área de notificações/pendências */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold mr-3">N</div>
          <div className="flex-1 text-sm font-semibold">1 Pendência</div>
          <X className="h-4 w-4" />
        </div>
      </div>
    </aside>
  )
}
