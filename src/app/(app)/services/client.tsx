"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SpecialtyOutput } from "@/modules/specialties/domain/specialty.schema"
import { ProcedureOutput } from "@/modules/procedures/domain/procedure.schema"
import { getSpecialtyColumns } from "./_components/specialty-columns"
import { getProcedureColumns } from "./_components/procedure-columns"
import { SpecialtyForm } from "./_components/specialty-form"
import { ProcedureForm } from "./_components/procedure-form"
import {
    createSpecialtyAction,
    updateSpecialtyAction,
    toggleSpecialtyStatusAction,
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
    const [activeTab, setActiveTab] = useState("specialties")
    const [procedures, setProcedures] = useState<ProcedureOutput[]>([])
    const [loadingProcedures, setLoadingProcedures] = useState(false)
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("all")

    // Modals
    const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false)
    const [specialtyToEdit, setSpecialtyToEdit] = useState<SpecialtyOutput | undefined>(undefined)

    const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false)
    const [procedureToEdit, setProcedureToEdit] = useState<ProcedureOutput | undefined>(undefined)

    // Handlers - Specialties
    const handleCreateSpecialty = async (data: any) => {
        try {
            await createSpecialtyAction(data)
            router.refresh()
        } catch (err) {
            console.error(err)
            alert("Erro ao criar especialidade")
        }
    }

    const handleUpdateSpecialty = async (data: any) => {
        try {
            await updateSpecialtyAction(data)
            router.refresh()
        } catch (err) {
            console.error(err)
            alert("Erro ao atualizar especialidade")
        }
    }

    const handleToggleSpecialty = async (id: string, isActive: boolean) => {
        try {
            await toggleSpecialtyStatusAction(id, isActive)
            router.refresh()
        } catch (err) {
            console.error(err)
            alert("Erro ao alterar status")
        }
    }

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

    const onTabChange = (value: string) => {
        setActiveTab(value)
        if (value === "procedures" && procedures.length === 0) {
            fetchProcedures(selectedSpecialtyId)
        }
    }

    const onSpecialtyFilterChange = (value: string) => {
        setSelectedSpecialtyId(value)
        fetchProcedures(value)
    }

    const handleCreateProcedure = async (data: any) => {
        try {
            await createProcedureAction(data)
            // For procedures, we update local state or re-fetch active filter
            fetchProcedures(selectedSpecialtyId)
        } catch (err) {
            console.error(err)
            alert("Erro ao criar procedimento")
        }
    }

    const handleUpdateProcedure = async (data: any) => {
        try {
            await updateProcedureAction(data)
            fetchProcedures(selectedSpecialtyId)
        } catch (err) {
            console.error(err)
            alert("Erro ao atualizar procedimento")
        }
    }

    const handleToggleProcedure = async (id: string, isActive: boolean) => {
        try {
            await toggleProcedureStatusAction(id, isActive)
            fetchProcedures(selectedSpecialtyId)
        } catch (err) {
            console.error(err)
            alert("Erro ao alterar status")
        }
    }

    // Columns
    const specialtyColumns = useMemo(() => getSpecialtyColumns({
        onEdit: (s) => {
            setSpecialtyToEdit(s)
            setIsSpecialtyModalOpen(true)
        },
        onToggleStatus: handleToggleSpecialty
    }), [])

    const procedureColumns = useMemo(() => getProcedureColumns({
        onEdit: (p) => {
            setProcedureToEdit(p)
            setIsProcedureModalOpen(true)
        },
        onToggleStatus: handleToggleProcedure
    }), [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Gestão de Serviços</h2>
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="specialties">Especialidades</TabsTrigger>
                    <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
                </TabsList>

                <TabsContent value="specialties" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => {
                            setSpecialtyToEdit(undefined)
                            setIsSpecialtyModalOpen(true)
                        }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Especialidade
                        </Button>
                    </div>

                    <DataTable
                        columns={specialtyColumns}
                        data={specialties}
                        searchKey="name"
                        searchPlaceholder="Buscar especialidade..."
                    />
                </TabsContent>

                <TabsContent value="procedures" className="space-y-4">
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
                </TabsContent>
            </Tabs>

            <SpecialtyForm
                open={isSpecialtyModalOpen}
                onOpenChange={setIsSpecialtyModalOpen}
                specialty={specialtyToEdit}
                onSubmit={specialtyToEdit ? handleUpdateSpecialty : handleCreateSpecialty}
            />

            <ProcedureForm
                open={isProcedureModalOpen}
                onOpenChange={setIsProcedureModalOpen}
                procedure={procedureToEdit}
                specialties={specialties}
                defaultSpecialtyId={selectedSpecialtyId !== "all" ? selectedSpecialtyId : undefined}
                onSubmit={procedureToEdit ? handleUpdateProcedure : handleCreateProcedure}
            />
        </div>
    )
}
