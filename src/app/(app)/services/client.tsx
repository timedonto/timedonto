"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SpecialtyOutput } from "@/modules/specialties/domain/specialty.schema"
import { ProcedureOutput } from "@/modules/procedures/domain/procedure.schema"
import { getProcedureColumns } from "./_components/procedure-columns"
import { ProcedureForm } from "./_components/procedure-form"
import {
    getProceduresAction,
    createProcedureAction,
    updateProcedureAction,
    toggleProcedureStatusAction
} from "./actions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface ServicesClientProps {
    specialties: SpecialtyOutput[]
}

export function ServicesClient({ specialties }: ServicesClientProps) {
    const router = useRouter()

    // State
    const [procedures, setProcedures] = useState<ProcedureOutput[]>([])
    const [loadingProcedures, setLoadingProcedures] = useState(false)
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("all")

    // Modals
    const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false)
    const [procedureToEdit, setProcedureToEdit] = useState<ProcedureOutput | undefined>(undefined)

    // Handlers - Procedures
    const fetchProcedures = async (specialtyId?: string) => {
        setLoadingProcedures(true)
        try {
            const data = await getProceduresAction(specialtyId === "all" ? undefined : specialtyId)
            setProcedures(data)
        } catch (err) {
            console.error(err)
            alert("Erro ao carregar procedimentos")
        } finally {
            setLoadingProcedures(false)
        }
    }

    const handleCreateProcedure = async (data: any) => {
        try {
            await createProcedureAction(data)
            router.refresh()
            await fetchProcedures(selectedSpecialtyId === "all" ? undefined : selectedSpecialtyId)
        } catch (err) {
            console.error(err)
            alert("Erro ao criar procedimento")
        }
    }

    const handleUpdateProcedure = async (data: any) => {
        try {
            await updateProcedureAction(data)
            router.refresh()
            await fetchProcedures(selectedSpecialtyId === "all" ? undefined : selectedSpecialtyId)
        } catch (err) {
            console.error(err)
            alert("Erro ao atualizar procedimento")
        }
    }

    const handleToggleProcedure = async (id: string, isActive: boolean) => {
        try {
            await toggleProcedureStatusAction(id, isActive)
            router.refresh()
            await fetchProcedures(selectedSpecialtyId === "all" ? undefined : selectedSpecialtyId)
        } catch (err) {
            console.error(err)
            alert("Erro ao alterar status")
        }
    }

    const onSpecialtyFilterChange = (value: string) => {
        setSelectedSpecialtyId(value)
        fetchProcedures(value === "all" ? undefined : value)
    }

    // Load procedures on mount
    useEffect(() => {
        fetchProcedures()
    }, [])

    // Procedure columns with actions
    const procedureColumns = getProcedureColumns({
        onEdit: (procedure) => {
            setProcedureToEdit(procedure)
            setIsProcedureModalOpen(true)
        },
        onToggleStatus: handleToggleProcedure
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
                    <p className="text-muted-foreground">
                        Gerencie os procedimentos da sua clínica
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="w-[300px]">
                        <Select value={selectedSpecialtyId} onValueChange={onSpecialtyFilterChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por especialidade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Especialidades</SelectItem>
                                {specialties.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={() => {
                        setProcedureToEdit(undefined)
                        setIsProcedureModalOpen(true)
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Procedimento
                    </Button>
                </div>

                <DataTable
                    columns={procedureColumns}
                    data={procedures}
                    searchKey="name"
                    searchPlaceholder="Buscar procedimento..."
                    loading={loadingProcedures}
                />
            </div>

            <ProcedureForm
                open={isProcedureModalOpen}
                onOpenChange={setIsProcedureModalOpen}
                procedure={procedureToEdit}
                specialties={specialties}
                defaultSpecialtyId={selectedSpecialtyId === "all" ? undefined : selectedSpecialtyId}
                onSubmit={procedureToEdit ? handleUpdateProcedure : handleCreateProcedure}
            />
        </div>
    )
}