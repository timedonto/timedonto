"use client"

import * as React from "react"
import { FilePlus, FileText, Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClinicalDocument {
    id: string
    type: string
    payload: any
    generatedAt: Date
}

interface AttendanceDocumentsTabProps {
    attendanceId: string
    initialDocuments: ClinicalDocument[]
    canGenerate?: boolean
}

const documentTypeLabels: Record<string, string> = {
    ATESTADO: 'Atestado Médico',
    PRESCRICAO: 'Prescrição',
    EXAME: 'Solicitação de Exame',
    ENCAMINHAMENTO: 'Encaminhamento'
}

export function AttendanceDocumentsTab({ attendanceId, initialDocuments, canGenerate = false }: AttendanceDocumentsTabProps) {
    const [documents, setDocuments] = React.useState<ClinicalDocument[]>(
        initialDocuments.map(doc => ({ ...doc, generatedAt: new Date(doc.generatedAt) }))
    )
    const [loading, setLoading] = React.useState(false)

    const handleGenerate = async (type: string) => {
        // Por enquanto apenas um exemplo de payload fixo
        const payload = type === 'ATESTADO' ? { days: 1, description: 'Repouso absoluto' } : {}
        
        try {
            setLoading(true)
            const response = await fetch(`/api/attendances/${attendanceId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, payload })
            })
            const data = await response.json()
            if (data.success) {
                setDocuments([
                    { ...data.data.document, generatedAt: new Date(data.data.document.generatedAt) },
                    ...documents
                ])
            } else {
                alert(data.error || 'Erro ao gerar documento')
            }
        } catch (err) {
            console.error('Erro ao gerar documento:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {canGenerate && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gerar Documentos</CardTitle>
                        <CardDescription>Crie documentos clínicos oficiais a partir deste atendimento.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleGenerate('ATESTADO')} disabled={loading}>
                            <FilePlus className="mr-2 h-4 w-4" />
                            Atestado
                        </Button>
                        <Button variant="outline" onClick={() => handleGenerate('PRESCRICAO')} disabled={loading}>
                            <FilePlus className="mr-2 h-4 w-4" />
                            Prescrição
                        </Button>
                        <Button variant="outline" onClick={() => handleGenerate('EXAME')} disabled={loading}>
                            <FilePlus className="mr-2 h-4 w-4" />
                            Exame
                        </Button>
                        <Button variant="outline" onClick={() => handleGenerate('ENCAMINHAMENTO')} disabled={loading}>
                            <FilePlus className="mr-2 h-4 w-4" />
                            Encaminhamento
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Documentos Emitidos</CardTitle>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground italic">
                            Nenhum documento emitido para este atendimento.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Documento</TableHead>
                                    <TableHead>Data de Emissão</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{documentTypeLabels[doc.type] || doc.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(doc.generatedAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" title="Imprimir">
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" title="Baixar">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
