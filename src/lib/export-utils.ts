import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ExportColumn {
  key: string
  header: string
  type?: 'string' | 'number' | 'date' | 'boolean' | 'currency'
}

/**
 * Formatar valor para exportação baseado no tipo
 */
export function formatValueForExport(value: any, type: ExportColumn['type'] = 'string'): string {
  if (value === null || value === undefined) {
    return ''
  }

  switch (type) {
    case 'date':
      try {
        const date = typeof value === 'string' ? new Date(value) : value
        return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
      } catch {
        return String(value)
      }

    case 'currency':
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numValue || 0)

    case 'number':
      const number = typeof value === 'string' ? parseFloat(value) : value
      return new Intl.NumberFormat('pt-BR').format(number || 0)

    case 'boolean':
      return value ? 'Sim' : 'Não'

    case 'string':
    default:
      return String(value)
  }
}

/**
 * Formatar dados para exportação
 */
export function formatDataForExport(data: any[], columns: ExportColumn[]): any[] {
  return data.map(row => {
    const formattedRow: any = {}
    
    columns.forEach(column => {
      const value = getNestedValue(row, column.key)
      formattedRow[column.header] = formatValueForExport(value, column.type)
    })
    
    return formattedRow
  })
}

/**
 * Obter valor aninhado de um objeto usando dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

/**
 * Converter array de objetos para CSV
 */
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','), // Cabeçalhos
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || ''
        // Escapar aspas duplas e envolver em aspas se contém vírgula ou quebra de linha
        const escapedValue = String(value).replace(/"/g, '""')
        return escapedValue.includes(',') || escapedValue.includes('\n') || escapedValue.includes('"')
          ? `"${escapedValue}"`
          : escapedValue
      }).join(',')
    )
  ].join('\n')

  return csvContent
}

/**
 * Exportar dados para CSV
 */
export function exportToCSV(data: any[], columns: ExportColumn[], filename: string): void {
  try {
    // Formatar dados
    const formattedData = formatDataForExport(data, columns)
    
    // Converter para CSV
    const csvContent = arrayToCSV(formattedData)
    
    // Adicionar BOM para UTF-8 (suporte a acentos)
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csvContent
    
    // Criar blob e download
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error('Erro ao exportar CSV:', error)
    throw new Error('Erro ao exportar arquivo CSV')
  }
}

/**
 * Gerar nome de arquivo com data atual
 */
export function generateFilename(baseName: string): string {
  const now = new Date()
  const timestamp = format(now, 'yyyy-MM-dd_HH-mm-ss')
  return `${baseName}_${timestamp}`
}