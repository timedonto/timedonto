'use client'

import { useState, useEffect } from 'react'
import type { DashboardData } from '@/modules/dashboard/application'

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard')
      
      // Verificar se a resposta é ok antes de fazer parse do JSON
      if (!response.ok) {
        // Tentar fazer parse do JSON para obter a mensagem de erro
        let errorMessage = 'Erro ao carregar dados do dashboard'
        try {
          const errorResult = await response.json()
          errorMessage = errorResult.error || errorMessage
        } catch {
          // Se não conseguir fazer parse, usar a mensagem padrão baseada no status
          if (response.status === 401) {
            errorMessage = 'Não autorizado'
          } else if (response.status === 500) {
            errorMessage = 'Erro interno do servidor'
          }
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao buscar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData
  }
}