'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/config/constants'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/appointments', label: 'Agenda', icon: Calendar },
  { href: '/dentists', label: 'Dentistas', icon: Stethoscope },
  { href: '/treatment-plans', label: 'Orçamentos', icon: FileText },
  { href: '/finance', label: 'Financeiro', icon: DollarSign },
  { href: '/inventory', label: 'Estoque', icon: Package },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-heading tracking-tight">{APP_NAME}</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

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
        })}
      </nav>

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
