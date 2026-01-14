"use client"

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FilterValues {
  fromDate?: string
  toDate?: string
  dentistId?: string
  [key: string]: any
}

interface Dentist {
  id: string
  user: {
    name: string
  }
}

interface ReportFilterProps {
  onFilter: (filters: FilterValues) => void
  showDateRange?: boolean
  showDentist?: boolean
  dentists?: Dentist[]
  initialValues?: FilterValues
  className?: string
}

export function ReportFilter({
  onFilter,
  showDateRange = true,
  showDentist = false,
  dentists = [],
  initialValues = {},
  className
}: ReportFilterProps) {
  const [filters, setFilters] = useState<FilterValues>(initialValues)

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onFilter(filters)
  }

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {}
    setFilters(clearedFilters)
    onFilter(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '')

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          {showDateRange && (
            <>
              <div className="flex items-center space-x-2">
                <Label htmlFor="from-date">De:</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  className="w-[150px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="to-date">Até:</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  className="w-[150px]"
                />
              </div>
            </>
          )}

          {showDentist && dentists.length > 0 && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="dentist-filter">Dentista:</Label>
              <Select 
                value={filters.dentistId || 'all'} 
                onValueChange={(value) => handleFilterChange('dentistId', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os dentistas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os dentistas</SelectItem>
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id}>
                      {dentist.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleApplyFilters} size="sm">
              Filtrar
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}