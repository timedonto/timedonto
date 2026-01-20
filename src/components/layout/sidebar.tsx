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
  X,
  Briefcase,
  UserCircle
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
  {
    href: '/inventory',
    label: 'Estoque',
    icon: Package,
    requiredRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTIONIST]
  },
  {
    href: '/reports',
    label: 'Relatórios',
    icon: BarChart3,
    requiredRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.DENTIST]
  },
  {
    href: '/services',
    label: 'Serviços',
    icon: Briefcase,
    requiredRoles: [] // Todos têm acesso a visualizar
  },
  {
    href: '/profile',
    label: 'Meu Perfil',
    icon: UserCircle,
    requiredRoles: [UserRole.DENTIST]
  },
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

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
        onClick={() => {
          if (window.innerWidth < 768) {
            onClose()
          }
        }}
        className={cn(
          'flex items-center px-4 py-3 rounded-lg font-medium transition-all group overflow-hidden whitespace-nowrap',
          isActive
            ? 'bg-primary text-white'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
      >
        <Icon className={cn(
          "mr-3 h-5 w-5 shrink-0",
          isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
        )} />
        <span className={cn(
          "transition-all duration-300",
          "md:opacity-0 md:group-hover:opacity-100 lg:opacity-100"
        )}>
          {item.label}
        </span>
      </Link>
    )
  }

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen transition-all duration-300 ease-in-out transform",
      isOpen ? "translate-x-0" : "-translate-x-full",
      "md:sticky md:top-0 md:translate-x-0 md:w-20 md:hover:w-64 lg:w-64 group"
    )}>
      <div className="p-6 flex items-center justify-between">
        <h1 className={cn(
          "text-2xl font-bold text-heading tracking-tight transition-all duration-300 overflow-hidden whitespace-nowrap",
          "md:w-0 md:group-hover:w-auto lg:w-auto"
        )}>
          {APP_NAME}
        </h1>
        <button
          onClick={onClose}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <X className="h-6 w-6" />
        </button>
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
        <div className="flex items-center p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 cursor-pointer overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold mr-3 shrink-0">N</div>
          <div className={cn(
            "flex-1 text-sm font-semibold transition-all duration-300 whitespace-nowrap",
            "md:opacity-0 md:group-hover:opacity-100 lg:opacity-100"
          )}>
            1 Pendência
          </div>
          <X className={cn(
            "h-4 w-4 shrink-0 transition-all duration-300",
            "md:opacity-0 md:group-hover:opacity-100 lg:opacity-100"
          )} />
        </div>
      </div>
    </aside>
  )
}
