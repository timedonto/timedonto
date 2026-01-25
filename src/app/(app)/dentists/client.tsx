"use client"

import * as React from "react"
import { Plus, CheckCircle2, XCircle, Stethoscope } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { getColumns, Dentist } from "./columns"
import { COMMON_SPECIALTIES } from "@/modules/dentists/domain/dentist.schema"

interface DentistsClientProps {
    data: Dentist[]
    onEdit: (dentist: Dentist) => void
    onDelete: (dentistId: string, dentistName: string) => void
    onCreate: () => void
    canEdit: boolean
    loading?: boolean
}

export function DentistsClient({
    data,
    onEdit,
    onDelete,
    onCreate,
    canEdit,
    loading = false,
}: DentistsClientProps) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const columns = React.useMemo(
        () => getColumns({ onEdit, onDelete, canEdit }),
        [onEdit, onDelete, canEdit]
    )

    const specialtyOptions = React.useMemo(() => [
        { label: "Clínico Geral", value: "none" },
        ...COMMON_SPECIALTIES.map(s => ({ label: s, value: s, icon: Stethoscope }))
    ], [])

    const statusOptions = [
        { label: "Ativo", value: "active", icon: CheckCircle2 },
        { label: "Inativo", value: "inactive", icon: XCircle },
    ]

    if (!mounted) {
        return null
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dentistas</h1>
                    <p className="text-muted-foreground">
                        Gerencie o corpo clínico e configurações de comissão
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={onCreate} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Dentista
                    </Button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={data}
                searchKey="name"
                searchPlaceholder="Filtrar por nome..."
                loading={loading}
                filters={[
                    {
                        columnId: "specialty",
                        title: "Especialidade",
                        options: specialtyOptions,
                    },
                    {
                        columnId: "status",
                        title: "Status",
                        options: statusOptions,
                    },
                ]}
            />
        </div>
    )
}
