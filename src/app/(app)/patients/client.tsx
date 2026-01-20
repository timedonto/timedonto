"use client"

import * as React from "react"
import { Plus, CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { getColumns } from "./columns"
import { PatientOutput } from "@/modules/patients/domain/patient.schema"

interface PatientsClientProps {
    data: PatientOutput[]
    onEdit: (patient: PatientOutput) => void
    onView: (patientId: string) => void
    onCreate: () => void
    loading?: boolean
}

export function PatientsClient({
    data,
    onEdit,
    onView,
    onCreate,
    loading = false,
}: PatientsClientProps) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const columns = React.useMemo(
        () => getColumns({ onEdit, onView }),
        [onEdit, onView]
    )

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
                    <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
                    <p className="text-muted-foreground">
                        Gerencie os cadastros e prontuários dos pacientes
                    </p>
                </div>
                <Button onClick={onCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Paciente
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                searchKey="name"
                searchPlaceholder="Filtrar por nome..."
                loading={loading}
                filters={[
                    {
                        columnId: "isActive",
                        title: "Status",
                        options: statusOptions,
                    },
                ]}
            />
        </div>
    )
}
