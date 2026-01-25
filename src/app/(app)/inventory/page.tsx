"use client"

import { useState, useEffect } from 'react'
import { InventoryClient } from './client'
import { InventoryItemOutput } from '@/modules/inventory/domain/inventory-item.schema'
import { InventoryMovement } from './movement-columns'

// Interface para dados da API (com datas como strings)
interface InventoryItemApiData {
  id: string
  clinicId: string
  name: string
  description: string | null
  unit: string
  currentQuantity: number
  minQuantity: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Converter dados da API para InventoryItemOutput
const convertApiDataToInventoryItem = (apiData: InventoryItemApiData): InventoryItemOutput => ({
  ...apiData,
  createdAt: new Date(apiData.createdAt),
  updatedAt: new Date(apiData.updatedAt),
})

// Interface para movimentações da API
interface InventoryMovementApiData {
  id: string
  clinicId: string
  itemId: string
  type: 'IN' | 'OUT'
  quantity: number
  appointmentId: string | null
  createdById: string
  notes: string | null
  createdAt: string
  item?: {
    id: string
    name: string
    unit: string
  }
  createdBy?: {
    id: string
    name: string
  }
  appointment?: {
    id: string
    date: string
    procedure: string | null
    patient?: {
      id: string
      name: string
    }
  }
}

// Converter dados da API para InventoryMovement
const convertApiDataToInventoryMovement = (apiData: InventoryMovementApiData): InventoryMovement => ({
  ...apiData,
  createdAt: new Date(apiData.createdAt),
  appointment: apiData.appointment ? {
    ...apiData.appointment,
    date: new Date(apiData.appointment.date)
  } : undefined
})

interface ApiResponse {
  success: boolean
  data?: InventoryItemApiData[]
  error?: string
}

interface MovementsApiResponse {
  success: boolean
  data?: InventoryMovementApiData[]
  error?: string
}

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(true)

  // Carregar itens de estoque
  const fetchInventoryItems = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/inventory-items')
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar itens de estoque')
      }

      if (data.success && data.data) {
        const convertedItems = data.data.map(convertApiDataToInventoryItem)
        setInventoryItems(convertedItems)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar itens de estoque:', err)
    } finally {
      setLoading(false)
    }
  }

  // Carregar movimentações de estoque
  const fetchInventoryMovements = async () => {
    try {
      setMovementsLoading(true)

      const response = await fetch('/api/inventory-movements')
      const data: MovementsApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar movimentações')
      }

      if (data.success && data.data) {
        const convertedMovements = data.data.map(convertApiDataToInventoryMovement)
        // Limitar a 100 movimentações mais recentes
        setMovements(convertedMovements.slice(0, 100))
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar movimentações:', err)
    } finally {
      setMovementsLoading(false)
    }
  }

  // Carregar itens e movimentações ao montar o componente
  useEffect(() => {
    fetchInventoryItems()
    fetchInventoryMovements()
  }, [])

  const handleSuccess = () => {
    fetchInventoryItems()
    fetchInventoryMovements()
  }

  const handleEdit = (item: InventoryItemOutput) => {
    // A lógica de edição é gerenciada pelo client
  }

  const handleCreateItem = () => {
    // A lógica de criação é gerenciada pelo client
  }

  const handleCreateMovement = () => {
    // A lógica de criação é gerenciada pelo client
  }

  return (
    <InventoryClient
      items={inventoryItems}
      movements={movements}
      onEdit={handleEdit}
      onCreateItem={handleCreateItem}
      onCreateMovement={handleCreateMovement}
      onSuccess={handleSuccess}
      loading={loading}
      movementsLoading={movementsLoading}
    />
  )
}
