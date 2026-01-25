"use client"

import * as React from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Odontogram } from "@/components/records/odontogram"

interface AttendanceOdontogramTabProps {
    attendanceId: string
    initialData?: any
    readOnly?: boolean
}

export function AttendanceOdontogramTab({ attendanceId, initialData = {}, readOnly = false }: AttendanceOdontogramTabProps) {
    const [odontogramData, setOdontogramData] = React.useState<Record<string, string>>(initialData || {})
    const [loading, setLoading] = React.useState(false)
    const [hasChanges, setHasChanges] = React.useState(false)

    const handleSave = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/attendances/${attendanceId}/odontogram`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: odontogramData })
            })
            if (response.ok) {
                setHasChanges(false)
            } else {
                const data = await response.json()
                alert(data.error || 'Erro ao salvar odontograma')
            }
        } catch (err) {
            console.error('Erro ao salvar odontograma:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (newData: Record<string, string>) => {
        setOdontogramData(newData)
        setHasChanges(true)
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Odontograma do Atendimento</CardTitle>
                        <CardDescription>Snapshot do estado clínico dos dentes neste atendimento.</CardDescription>
                    </div>
                    {!readOnly && (
                        <Button 
                            onClick={handleSave} 
                            disabled={loading || !hasChanges}
                            variant={hasChanges ? "default" : "outline"}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="bg-muted/30 rounded-b-lg pt-6">
                    <Odontogram 
                        data={odontogramData} 
                        onChange={!readOnly ? handleChange : undefined}
                        readOnly={readOnly}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
