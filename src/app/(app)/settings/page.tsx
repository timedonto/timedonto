"use client"

import { UserRole } from '@/types/roles'
import { Settings, Users, Database, Shield, Bell, Palette } from 'lucide-react'
import Link from 'next/link'
import { RequireRole } from '@/components/auth/require-role'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const settingsOptions = [
  {
    title: 'Usuários',
    description: 'Gerencie usuários e permissões da clínica',
    icon: Users,
    href: '/settings/users',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
  },
  {
    title: 'Dados da Clínica',
    description: 'Informações gerais, endereço e contato',
    icon: Database,
    href: '/settings/clinic',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  {
    title: 'Segurança',
    description: 'Configurações de segurança e autenticação',
    icon: Shield,
    href: '/settings/security',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20'
  },
  {
    title: 'Notificações',
    description: 'Preferências de notificações e alertas',
    icon: Bell,
    href: '/settings/notifications',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20'
  },
  {
    title: 'Aparência',
    description: 'Tema, cores e personalização da interface',
    icon: Palette,
    href: '/settings/appearance',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
  }
]

function SettingsPageContent() {
  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da clínica e do sistema
        </p>
      </div>

      {/* Grid de opções */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsOptions.map((option) => {
          const Icon = option.icon
          
          return (
            <Link key={option.href} href={option.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${option.bgColor}`}>
                      <Icon className={`h-6 w-6 ${option.color}`} />
                    </div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Informações adicionais */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-medium text-sm">Acesso Restrito</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Apenas proprietários e administradores podem acessar as configurações do sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <RequireRole allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
      <SettingsPageContent />
    </RequireRole>
  )
}