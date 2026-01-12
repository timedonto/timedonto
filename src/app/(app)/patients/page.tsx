"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Loader2, Search } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { PatientFormModal } from '@/components/patients/patient-form-modal'
import { PatientOutput } from '@/modules/patients/domain/patient.schema'

// Interface para dados da API (com datas como strings)
interface PatientApiData {
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

// Converter dados da API para PatientOutput
const convertApiDataToPatient = (apiData: PatientApiData): PatientOutput => ({
  ...apiData,
  birthDate: apiData.birthDate ? new Date(apiData.birthDate) : null,
  createdAt: new Date(apiData.createdAt),
  updatedAt: new Date(apiData.updatedAt),
})

interface ApiResponse {
  success: boolean
  data?: PatientApiData[]
  error?: string
}

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientOutput | undefined>(undefined)

  // Filtrar pacientes baseado no termo de busca
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) {
      return patients
    }

    const term = searchTerm.toLowerCase().trim()
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(term) ||
      patient.email?.toLowerCase().includes(term) ||
      patient.phone?.toLowerCase().includes(term) ||
      patient.cpf?.toLowerCase().includes(term)
    )
  }, [patients, searchTerm])

  // Carregar pacientes
  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/patients')
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar pacientes')
      }

      if (data.success && data.data) {
        const convertedPatients = data.data.map(convertApiDataToPatient)
        setPatients(convertedPatients)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }

  // Carregar pacientes ao montar o componente
  useEffect(() => {
    fetchPatients()
  }, [])

  // Handlers para ações
  const handleCreatePatient = () => {
    setSelectedPatient(undefined)
    setIsModalOpen(true)
  }

  const handleEditPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (patient) {
      setSelectedPatient(patient)
      setIsModalOpen(true)
    }
  }

  const handlePatientClick = (patientId: string) => {
    router.push(`/patients/${patientId}`)
  }

  const handleModalSuccess = () => {
    fetchPatients()
  }

  // Formatar CPF para exibição
  const formatCpf = (cpf: string | null) => {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  // Formatar telefone para exibição
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

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie os pacientes da clínica
          </p>
        </div>
        <Button onClick={handleCreatePatient} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      {/* Campo de busca */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, telefone ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="rounded-md border">
        {loading ? (
          // Estado de loading
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando pacientes...
            </div>
          </div>
        ) : error ? (
          // Estado de erro
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Erro ao carregar pacientes</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchPatients} variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : filteredPatients.length === 0 ? (
          // Estado vazio
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {searchTerm.trim() ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm.trim() 
                  ? 'Tente ajustar os termos da busca'
                  : 'Comece cadastrando o primeiro paciente da clínica'
                }
              </p>
            </div>
            {!searchTerm.trim() && (
              <Button onClick={handleCreatePatient} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Primeiro Paciente
              </Button>
            )}
          </div>
        ) : (
          // Tabela de pacientes
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow 
                  key={patient.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handlePatientClick(patient.id)}
                >
                  <TableCell className="font-medium">
                    {patient.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.email || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPhone(patient.phone)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCpf(patient.cpf)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={patient.isActive ? 'success' : 'destructive'}
                    >
                      {patient.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPatient(patient.id)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar paciente</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de criar/editar paciente */}
      <PatientFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        patient={selectedPatient}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}