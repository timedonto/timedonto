"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Loader2, Calendar, FileText, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientFormModal } from '@/components/patients/patient-form-modal'

interface Patient {
  id: string
  clinicId: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  birthDate: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  data?: Patient
  error?: string
}

interface PatientDetailsPageProps {
  params: { id: string }
}

export default function PatientDetailsPage({ params }: PatientDetailsPageProps) {
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('agenda')

  // Buscar dados do paciente
  const fetchPatient = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/patients/${params.id}`)
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError('Paciente não encontrado')
        } else {
          throw new Error(data.error || 'Erro ao carregar paciente')
        }
        return
      }

      if (data.success && data.data) {
        setPatient(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar paciente:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar paciente')
    } finally {
      setLoading(false)
    }
  }

  // Carregar paciente ao montar o componente
  useEffect(() => {
    fetchPatient()
  }, [params.id])

  // Handlers
  const handleBack = () => {
    router.push('/patients')
  }

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchPatient() // Recarregar dados após edição
  }

  // Formatadores
  const formatCpf = (cpf: string | null) => {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return '-'
    }
  }

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando dados do paciente...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erro ao carregar paciente</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBack} variant="outline">
            Voltar para lista
          </Button>
          <Button onClick={fetchPatient}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Paciente não encontrado</h3>
          <p className="text-muted-foreground">
            O paciente que você está procurando não existe ou foi removido
          </p>
        </div>
        <Button onClick={handleBack} variant="outline">
          Voltar para lista
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'orcamentos', label: 'Orçamentos', icon: DollarSign },
    { id: 'prontuario', label: 'Prontuário', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para lista
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
            <Badge variant={patient.isActive ? 'success' : 'destructive'}>
              {patient.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
        <Button onClick={handleEdit} className="flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Cards com informações */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-sm">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm">{formatCpf(patient.cpf)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
              <p className="text-sm">{formatDate(patient.birthDate)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{patient.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="text-sm">{formatPhone(patient.phone)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Endereço</p>
              <p className="text-sm">{patient.address || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {patient.notes && (
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Seção de Abas */}
      <div className="space-y-4">
        {/* Navegação das abas */}
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Conteúdo das abas */}
        <Card>
          <CardContent className="pt-6">
            {activeTab === 'agenda' && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Agenda</h3>
                <p className="text-muted-foreground">
                  Agendamentos serão implementados na Sprint 4
                </p>
              </div>
            )}

            {activeTab === 'orcamentos' && (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Orçamentos</h3>
                <p className="text-muted-foreground">
                  Orçamentos serão implementados na Sprint 6
                </p>
              </div>
            )}

            {activeTab === 'prontuario' && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Prontuário</h3>
                <p className="text-muted-foreground">
                  Prontuário será implementado na Sprint 5
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de edição */}
      <PatientFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        patient={patient}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}