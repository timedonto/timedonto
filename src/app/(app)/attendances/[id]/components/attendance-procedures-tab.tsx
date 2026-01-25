"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Procedure {
    id: string
    procedureCode: string
    description: string
    tooth: string | null
    surface: string | null
    quantity: number
}

interface AttendanceProceduresTabProps {
    attendanceId: string
    initialProcedures: Procedure[]
    readOnly?: boolean
}

export function AttendanceProceduresTab({ attendanceId, initialProcedures, readOnly = false }: AttendanceProceduresTabProps) {
    const [procedures, setProcedures] = React.useState<Procedure[]>(initialProcedures)
    const [loading, setLoading] = React.useState(false)
    
    // Procedure Form
    const [procedureCode, setProcedureCode] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [tooth, setTooth] = React.useState("")
    const [quantity, setQuantity] = React.useState(1)

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            const response = await fetch(`/api/attendances/${attendanceId}/procedures`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ procedureCode, description, tooth, quantity })
            })
            const data = await response.json()
            if (data.success) {
                setProcedures(data.data.procedures)
                setProcedureCode("")
                setDescription("")
                setTooth("")
                setQuantity(1)
            } else {
                alert(data.error || 'Erro ao adicionar procedimento')
            }
        } catch (err) {
            console.error('Erro ao adicionar procedimento:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (procedureId: string) => {
        alert('Funcionalidade de remoção em desenvolvimento')
    }

    return (
        <div className="space-y-4">
            {!readOnly && (
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Procedimento</CardTitle>
                        <CardDescription>Registre os procedimentos realizados neste atendimento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-5 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Código</label>
                                <Input 
                                    placeholder="Ex: 10101012" 
                                    value={procedureCode} 
                                    onChange={(e) => setProcedureCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Descrição</label>
                                <Input 
                                    placeholder="Nome do procedimento" 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Dente</label>
                                <Input 
                                    placeholder="Ex: 11" 
                                    value={tooth} 
                                    onChange={(e) => setTooth(e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Procedimentos Realizados</CardTitle>
                </CardHeader>
                <CardContent>
                    {procedures.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground italic">
                            Nenhum procedimento registrado para este atendimento.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Código</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Dente</TableHead>
                                    <TableHead className="text-right">Qtd</TableHead>
                                    {!readOnly && <TableHead className="w-[100px]"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {procedures.map((proc) => (
                                    <TableRow key={proc.id}>
                                        <TableCell>{proc.procedureCode}</TableCell>
                                        <TableCell className="font-medium">{proc.description}</TableCell>
                                        <TableCell>{proc.tooth || '-'}</TableCell>
                                        <TableCell className="text-right">{proc.quantity}</TableCell>
                                        {!readOnly && (
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(proc.id)} className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        )}
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
