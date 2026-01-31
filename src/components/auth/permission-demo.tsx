"use client"

import { UserRole } from '@/types/roles'
import { Shield, Users, Settings, Eye } from 'lucide-react'
import { RequireRole, roleLabels } from './require-role'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PermissionDemo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Demonstração de Permissões</h2>
        <p className="text-muted-foreground">
          Exemplos de como as permissões funcionam no sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Todos podem ver */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Acesso Público</CardTitle>
            </div>
            <CardDescription>
              Todos os usuários autenticados podem ver este conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">✅ Dashboard</p>
              <p className="text-sm">✅ Lista de Dentistas</p>
              <p className="text-sm">✅ Lista de Pacientes</p>
              <p className="text-sm">✅ Agenda</p>
            </div>
          </CardContent>
        </Card>

        {/* Apenas OWNER/ADMIN */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Acesso Restrito</CardTitle>
            </div>
            <CardDescription>
              Apenas proprietários e administradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequireRole allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
              <div className="space-y-2">
                <p className="text-sm text-green-600">✅ Você pode ver este conteúdo!</p>
                <div className="flex gap-2">
                  <Badge variant="default">
                    {roleLabels[UserRole.OWNER]}
                  </Badge>
                  <Badge variant="secondary">
                    {roleLabels[UserRole.ADMIN]}
                  </Badge>
                </div>
              </div>
            </RequireRole>
          </CardContent>
        </Card>

        {/* Apenas OWNER */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Apenas Proprietário</CardTitle>
            </div>
            <CardDescription>
              Funcionalidades exclusivas do proprietário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequireRole allowedRoles={[UserRole.OWNER]}>
              <div className="space-y-2">
                <p className="text-sm text-green-600">✅ Acesso de proprietário confirmado!</p>
                <Badge variant="default">
                  {roleLabels[UserRole.OWNER]}
                </Badge>
              </div>
            </RequireRole>
          </CardContent>
        </Card>

        {/* Apenas DENTIST */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Apenas Dentistas</CardTitle>
            </div>
            <CardDescription>
              Funcionalidades específicas para dentistas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequireRole allowedRoles={[UserRole.DENTIST]}>
              <div className="space-y-2">
                <p className="text-sm text-green-600">✅ Você é um dentista!</p>
                <Badge variant="success">
                  {roleLabels[UserRole.DENTIST]}
                </Badge>
              </div>
            </RequireRole>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}