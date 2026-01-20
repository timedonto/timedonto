"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PatientsClient } from './client'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientOutput | undefined>(undefined)

  // Carregar pacientes
  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/patients')

      // Log the response for debugging
      console.log('API Response Status:', response.status)

      let data: ApiResponse
      try {
        data = await response.json()
        console.log('API Response Data:', data)
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError)
        throw new Error('Erro ao processar resposta do servidor')
      }

      if (!response.ok) {
        console.error('API Error:', data.error)
        throw new Error(data.error || 'Erro ao carregar pacientes')
      }

      if (data.success && data.data) {
        const convertedPatients = data.data.map(convertApiDataToPatient)
        setPatients(convertedPatients)
      } else {
        throw new Error(data.error || 'Resposta inválida do servidor')
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pacientes'
      setError(errorMessage)
      setPatients([]) // Clear patients on error
    } finally {
      setLoading(false)
    }
  }

  const isMounted = React.useRef(false)

  // Carregar pacientes ao montar o componente
  useEffect(() => {
    fetchPatients()
    isMounted.current = true
  }, [])

  // Handlers para ações
  const handleCreatePatient = () => {
    setSelectedPatient(undefined)
    setIsModalOpen(true)
  }

  const handleEditPatient = (patient: PatientOutput) => {
    setSelectedPatient(patient)
    setIsModalOpen(true)
  }

  const handleViewPatient = (patientId: string) => {
    router.push(`/patients/${patientId}`)
  }

  const handleModalSuccess = () => {
    fetchPatients()
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium">
            {error}
          </p>
        </div>
      )}

      <PatientsClient
        data={patients}
        loading={loading}
        onEdit={handleEditPatient}
        onView={handleViewPatient}
        onCreate={handleCreatePatient}
      />

      <PatientFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        patient={selectedPatient}
        onSuccess={handleModalSuccess}
      />
    </>
  )
}