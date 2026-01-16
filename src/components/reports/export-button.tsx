"use client"

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCSV, generateFilename, ExportColumn } from '@/lib/export-utils'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  data: any[]
  filename: string
  columns: ExportColumn[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  disabled?: boolean
}

export function ExportButton({
  data,
  filename,
  columns,
  variant = 'outline',
  size = 'sm',
  className,
  disabled = false
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (data.length === 0) {
      alert('Não há dados para exportar')
      return
    }

    try {
      setIsExporting(true)
      
      // Gerar nome do arquivo com timestamp
      const fullFilename = generateFilename(filename)
      
      // Exportar para CSV
      exportToCSV(data, columns, fullFilename)
      
      // Pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Erro ao exportar arquivo. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled || isExporting || data.length === 0}
      className={cn("flex items-center gap-1 sm:gap-2", className)}
    >
      {isExporting ? (
        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
      ) : (
        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
      )}
      <span className="text-xs sm:text-sm">
        {isExporting ? 'Exportando...' : 'Exportar CSV'}
      </span>
    </Button>
  )
}